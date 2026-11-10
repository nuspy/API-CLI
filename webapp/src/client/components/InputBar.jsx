import React, { useState, useRef } from 'react';

export default function InputBar({ agents, isDiscussing, onSend, onStop }) {
  const [text, setText] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const textareaRef = useRef(null);

  // Select all agents by default when agents change
  React.useEffect(() => {
    setSelectedIds(new Set(agents.map((a) => a.id)));
  }, [agents]);

  const toggleAgent = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === agents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(agents.map((a) => a.id)));
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || selectedIds.size === 0) return;
    onSend(trimmed, Array.from(selectedIds));
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-bar">
      <div className="agent-target-bar">
        <label className="target-checkbox">
          <input
            type="checkbox"
            checked={selectedIds.size === agents.length && agents.length > 0}
            onChange={toggleAll}
          />
          <span>All</span>
        </label>
        {agents.map((agent) => (
          <label key={agent.id} className={`target-checkbox target-${agent.appType}`}>
            <input
              type="checkbox"
              checked={selectedIds.has(agent.id)}
              onChange={() => toggleAgent(agent.id)}
            />
            <span>{agent.name}</span>
          </label>
        ))}
      </div>
      <div className="input-row">
        <textarea
          ref={textareaRef}
          className="input chat-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message to the war room..."
          rows={1}
          disabled={isDiscussing}
        />
        {isDiscussing ? (
          <button className="btn btn-stop" onClick={onStop}>Stop</button>
        ) : (
          <button
            className="btn btn-send"
            onClick={handleSend}
            disabled={!text.trim() || selectedIds.size === 0}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
