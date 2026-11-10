import React from 'react';
import RoundIndicator from './RoundIndicator.jsx';
import MessageBubble from './MessageBubble.jsx';
import InputBar from './InputBar.jsx';

export default function ChatPanel({ agents, chat, ws }) {
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <RoundIndicator
          isDiscussing={chat.isDiscussing}
          currentRound={chat.currentRound}
          stoppedReason={chat.stoppedReason}
        />
      </div>
      <div className="message-list">
        {chat.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <InputBar
        agents={agents.agents}
        isDiscussing={chat.isDiscussing}
        onSend={chat.sendMessage}
        onStop={chat.stop}
      />
    </div>
  );
}
