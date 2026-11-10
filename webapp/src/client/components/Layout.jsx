import React from 'react';
import Sidebar from './Sidebar.jsx';
import ChatPanel from './ChatPanel.jsx';

export default function Layout({ ws, agents, chat, workDir }) {
  return (
    <div className="layout">
      <Sidebar agents={agents} workDir={workDir} ws={ws} />
      <ChatPanel agents={agents} chat={chat} ws={ws} />
    </div>
  );
}
