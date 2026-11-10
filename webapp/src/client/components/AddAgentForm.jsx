import React, { useState } from 'react';

const APP_TYPES = ['claude', 'codex', 'gemini', 'droid'];

export default function AddAgentForm({ onAdd }) {
  const [appType, setAppType] = useState('claude');
  const [name, setName] = useState('');

  const handleAdd = () => {
    onAdd(appType, name || undefined);
    setName('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="add-agent-form">
      <select
        className="input select"
        value={appType}
        onChange={(e) => setAppType(e.target.value)}
      >
        {APP_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input
        type="text"
        className="input name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Custom name..."
      />
      <button className="btn btn-add" onClick={handleAdd}>+</button>
    </div>
  );
}
