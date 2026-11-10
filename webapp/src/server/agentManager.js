import { v4 as uuidv4 } from 'uuid';

const VALID_TYPES = ['claude', 'codex', 'gemini', 'droid'];

class AgentManager {
  constructor() {
    this.agents = new Map();
  }

  add(appType, name, model) {
    if (!VALID_TYPES.includes(appType)) {
      return { error: `Invalid app type: ${appType}. Must be one of: ${VALID_TYPES.join(', ')}` };
    }
    const id = uuidv4();
    const agent = {
      id,
      appType,
      name: name || `${appType}-${this.agents.size + 1}`,
      model: model || null,
      status: 'idle',
      sessionId: null,
    };
    this.agents.set(id, agent);
    return agent;
  }

  remove(id) {
    this.agents.delete(id);
  }

  get(id) {
    return this.agents.get(id);
  }

  list() {
    return Array.from(this.agents.values());
  }

  setStatus(id, status) {
    const agent = this.agents.get(id);
    if (agent) agent.status = status;
  }

  setSessionId(id, sessionId) {
    const agent = this.agents.get(id);
    if (agent) agent.sessionId = sessionId;
  }

  resetSession(id) {
    const agent = this.agents.get(id);
    if (agent) agent.sessionId = null;
  }
}

export const agentManager = new AgentManager();
