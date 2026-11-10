import { agentManager } from './agentManager.js';
import { orchestrator } from './orchestrator.js';
import { gitCheckpoint } from './gitCheckpoint.js';

let clients = new Set();

function broadcast(type, data) {
  const msg = JSON.stringify({ type, ...data });
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

export { broadcast };

export function setupWsHandler(wss) {
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected');

    // Send current state on connect
    ws.send(JSON.stringify({ type: 'agents', agents: agentManager.list() }));
    ws.send(JSON.stringify({ type: 'work_dir', path: gitCheckpoint.getWorkDir(), valid: gitCheckpoint.isValid() }));
    if (orchestrator.isRunning()) {
      ws.send(JSON.stringify({ type: 'round', current: orchestrator.getCurrentRound(), max: 10 }));
    }

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      console.log(`[WS] Received: ${msg.type}`, msg.type === 'user_message' ? `(${msg.content?.slice(0, 50)}...)` : '');
      handleMessage(msg, ws);
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });
  });
}

function handleMessage(msg, ws) {
  switch (msg.type) {
    case 'add_agent': {
      const agent = agentManager.add(msg.appType, msg.name, msg.model);
      if (agent.error) {
        ws.send(JSON.stringify({ type: 'error', message: agent.error }));
      } else {
        broadcast('agents', { agents: agentManager.list() });
      }
      break;
    }

    case 'remove_agent': {
      agentManager.remove(msg.id);
      broadcast('agents', { agents: agentManager.list() });
      break;
    }

    case 'user_message': {
      orchestrator.handleUserMessage(msg.content, msg.targetAgentIds).catch((err) => {
        console.error('[Orchestrator] Unhandled error:', err);
        broadcast('error', { message: err.message });
      });
      break;
    }

    case 'stop': {
      orchestrator.stop();
      break;
    }

    case 'undo': {
      const result = gitCheckpoint.undo();
      broadcast('undo_result', result);
      break;
    }

    case 'set_work_dir': {
      const result = gitCheckpoint.setWorkDir(msg.path);
      broadcast('work_dir', result);
      break;
    }

    case 'reset_session': {
      agentManager.resetSession(msg.agentId);
      broadcast('agents', { agents: agentManager.list() });
      break;
    }

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
  }
}
