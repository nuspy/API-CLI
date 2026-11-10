import { v4 as uuidv4 } from 'uuid';
import { agentManager } from './agentManager.js';
import { conversationLog } from './conversationLog.js';
import { gitCheckpoint } from './gitCheckpoint.js';
import { buildSystemPrompt } from './systemPromptBuilder.js';
import { createAdapter } from './cliAdapters/index.js';
import { broadcast } from './wsHandler.js';
import treeKill from 'tree-kill';

const MAX_ROUNDS = 10;
const AGENT_TIMEOUT = 5 * 60 * 1000; // 5 min

class Orchestrator {
  constructor() {
    this._running = false;
    this._currentRound = 0;
    this._activeProcesses = new Map();
  }

  isRunning() {
    return this._running;
  }

  getCurrentRound() {
    return this._currentRound;
  }

  async handleUserMessage(content, targetAgentIds) {
    if (this._running) return;

    const allAgents = agentManager.list();
    console.log(`[Orchestrator] User message received. Targets: ${targetAgentIds?.length}, All agents: ${allAgents.length}`);
    const agents = allAgents.filter((a) =>
      targetAgentIds.includes(a.id)
    );
    if (agents.length === 0) {
      console.log('[Orchestrator] No matching agents found, skipping');
      return;
    }
    console.log(`[Orchestrator] Starting discussion with ${agents.map(a => a.name).join(', ')}`);

    this._running = true;
    this._currentRound = 0;

    // Add user message to log and broadcast
    const userMsg = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    conversationLog.addMessage(userMsg);
    broadcast('message', userMsg);

    try {
      await this._runDiscussion(agents, content);
    } catch (err) {
      broadcast('error', { message: `Orchestrator error: ${err.message}` });
    } finally {
      this._running = false;
    }
  }

  async _runDiscussion(agents, initialPrompt) {
    let activeAgents = [...agents];
    const passSet = new Set();
    const workDir = gitCheckpoint.getWorkDir();

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      if (!this._running) break;

      this._currentRound = round;
      broadcast('round', { current: round, max: MAX_ROUNDS });

      // Git checkpoint before each round
      if (gitCheckpoint.isValid()) {
        await gitCheckpoint.checkpoint(`round-${round}`);
      }

      // Invoke all active agents in parallel
      const promises = activeAgents
        .filter((a) => !passSet.has(a.id))
        .map((agent) => this._invokeAgent(agent, workDir));

      const results = await Promise.allSettled(promises);

      if (!this._running) break;

      let allPassed = true;

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { agent, output, sessionId } = result.value;

          if (sessionId) {
            agentManager.setSessionId(agent.id, sessionId);
          }

          const isPassed = this._isPass(output);

          if (isPassed) {
            passSet.add(agent.id);
          } else {
            allPassed = false;
            const agentMsg = {
              id: uuidv4(),
              role: 'agent',
              agentId: agent.id,
              agentName: agent.name,
              appType: agent.appType,
              content: output,
              round,
              timestamp: Date.now(),
            };
            conversationLog.addMessage(agentMsg);
            broadcast('message', agentMsg);
          }

          agentManager.setStatus(agent.id, 'idle');
          broadcast('agent_status', { agentId: agent.id, status: 'idle' });
        } else if (result.status === 'rejected') {
          const agentId = result.reason?.agentId;
          if (agentId) {
            agentManager.setStatus(agentId, 'error');
            broadcast('agent_status', { agentId, status: 'error' });
            broadcast('message', {
              id: uuidv4(),
              role: 'agent',
              agentId,
              agentName: agentManager.get(agentId)?.name || 'unknown',
              appType: agentManager.get(agentId)?.appType || 'unknown',
              content: `Error: ${result.reason?.message || 'Unknown error'}`,
              round,
              timestamp: Date.now(),
            });
          }
        }
      }

      // Check convergence: all agents passed
      if (passSet.size >= activeAgents.length || allPassed) {
        broadcast('stopped', { reason: 'converged', round });
        return;
      }
    }

    if (!this._running) {
      broadcast('stopped', { reason: 'user', round: this._currentRound });
    } else {
      broadcast('stopped', { reason: 'max_rounds', round: MAX_ROUNDS });
    }
  }

  async _invokeAgent(agent, workDir) {
    console.log(`[Agent] Invoking ${agent.name} (${agent.appType})...`);
    agentManager.setStatus(agent.id, 'thinking');
    broadcast('agent_status', { agentId: agent.id, status: 'thinking' });

    const adapter = createAdapter(agent.appType);
    const allAgents = agentManager.list();
    const systemPrompt = buildSystemPrompt(agent.name, allAgents, workDir);
    const prompt = conversationLog.buildPromptFor(agent);

    try {
      const { pid, result } = await adapter.invoke({
        prompt,
        model: agent.model,
        systemPrompt,
        sessionId: agent.sessionId,
        workDir,
        timeout: AGENT_TIMEOUT,
        onPid: (pid) => this._activeProcesses.set(agent.id, pid),
      });
      this._activeProcesses.delete(agent.id);

      console.log(`[Agent] ${agent.name} responded (${result.content?.length || 0} chars)`);
      return {
        agent,
        output: result.content,
        sessionId: result.sessionId || null,
      };
    } catch (err) {
      console.error(`[Agent] ${agent.name} error:`, err.message);
      this._activeProcesses.delete(agent.id);
      err.agentId = agent.id;
      throw err;
    }
  }

  _isPass(output) {
    if (!output) return false;
    const trimmed = output.trim();
    if (trimmed === '[PASS]') return true;
    const lines = trimmed.split('\n');
    return lines[lines.length - 1].trim() === '[PASS]';
  }

  stop() {
    this._running = false;
    // Kill all active processes
    for (const [agentId, pid] of this._activeProcesses) {
      try {
        treeKill(pid, 'SIGTERM');
      } catch {
        // Process may already be dead
      }
      agentManager.setStatus(agentId, 'idle');
      broadcast('agent_status', { agentId, status: 'idle' });
    }
    this._activeProcesses.clear();
  }
}

export const orchestrator = new Orchestrator();
