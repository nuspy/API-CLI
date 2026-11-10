import { useState, useEffect, useCallback } from 'react';

export function useAgents(ws) {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    return ws.registerHandler('agents', (msg) => {
      setAgents(msg.agents);
    });
  }, [ws]);

  const addAgent = useCallback((appType, name, model) => {
    ws.send('add_agent', { appType, name, model });
  }, [ws]);

  const removeAgent = useCallback((id) => {
    ws.send('remove_agent', { id });
  }, [ws]);

  const resetSession = useCallback((agentId) => {
    ws.send('reset_session', { agentId });
  }, [ws]);

  return { agents, addAgent, removeAgent, resetSession };
}
