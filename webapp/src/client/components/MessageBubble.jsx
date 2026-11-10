import React from 'react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const appType = message.appType || 'user';

  return (
    <div className={`message-bubble ${isUser ? 'message-user' : 'message-agent'}`}>
      <div className="message-header">
        <span className={`message-author author-${appType}`}>
          {isUser ? 'You' : message.agentName}
        </span>
        {message.round && (
          <span className="message-round">R{message.round}</span>
        )}
        <span className="message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="message-content">
        {message.content}
      </div>
    </div>
  );
}
