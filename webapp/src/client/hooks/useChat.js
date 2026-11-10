import { useState, useEffect, useCallback } from 'react';

export function useChat(ws, agentsCtx) {
  const [messages, setMessages] = useState([]);
  const [isDiscussing, setIsDiscussing] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [stoppedReason, setStoppedReason] = useState(null);

  useEffect(() => {
    const unsubs = [
      ws.registerHandler('message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      }),
      ws.registerHandler('round', (msg) => {
        setCurrentRound(msg.current);
        setIsDiscussing(true);
        setStoppedReason(null);
      }),
      ws.registerHandler('stopped', (msg) => {
        setIsDiscussing(false);
        setStoppedReason(msg.reason);
      }),
      ws.registerHandler('agent_status', (msg) => {
        // Could be used to update per-agent status indicators
      }),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [ws]);

  const sendMessage = useCallback((content, targetAgentIds) => {
    ws.send('user_message', { content, targetAgentIds });
  }, [ws]);

  const stop = useCallback(() => {
    ws.send('stop');
  }, [ws]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStoppedReason(null);
    setCurrentRound(0);
  }, []);

  return { messages, isDiscussing, currentRound, stoppedReason, sendMessage, stop, clearMessages };
}
