import React from 'react';

const STATUS_LABELS = {
  idle: 'Idle',
  thinking: 'Thinking...',
  error: 'Error',
};

export default function AgentCard({ agent, onRemove, onReset }) {
  return (
    <div className={`agent-card agent-${agent.appType}`}>
      <div className={`status-dot status-${agent.status}`} />
      <div className="agent-info">
        <span className="agent-name">{agent.name}</span>
        <span className={`agent-badge badge-${agent.appType}`}>{agent.appType}</span>
      </div>
      <div className="agent-actions">
        {agent.sessionId && (
          <button className="btn-icon" onClick={onReset} title="Reset session">
            &#x21bb;
          </button>
        )}
        <button className="btn-icon btn-remove" onClick={onRemove} title="Remove agent">
          &times;
        </button>
      </div>
    </div>
  );
}
