import React from 'react';
import { useWebSocket } from './hooks/useWebSocket.js';
import { useAgents } from './hooks/useAgents.js';
import { useChat } from './hooks/useChat.js';
import { useWorkDir } from './hooks/useWorkDir.js';
import Layout from './components/Layout.jsx';
import './App.css';

export default function App() {
  const ws = useWebSocket();
  const agents = useAgents(ws);
  const chat = useChat(ws, agents);
  const workDir = useWorkDir(ws);

  return (
    <Layout ws={ws} agents={agents} chat={chat} workDir={workDir} />
  );
}
