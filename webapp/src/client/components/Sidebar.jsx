import React from 'react';
import AddAgentForm from './AddAgentForm.jsx';
import AgentCard from './AgentCard.jsx';

export default function Sidebar({ agents, workDir, ws }) {
  const [dirInput, setDirInput] = React.useState(workDir.workDir);

  React.useEffect(() => {
    setDirInput(workDir.workDir);
  }, [workDir.workDir]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>War Room</h2>
        <span className={`connection-dot ${ws.connected ? 'connected' : ''}`} />
      </div>

      <div className="sidebar-section">
        <label className="section-label">Working Directory</label>
        <div className="workdir-row">
          <input
            type="text"
            className="input workdir-input"
            value={dirInput}
            onChange={(e) => setDirInput(e.target.value)}
            placeholder="D:\Projects\..."
          />
          <button
            className="btn btn-sm"
            onClick={() => workDir.setDir(dirInput)}
          >
            Set
          </button>
        </div>
        {workDir.workDir && (
          <span className={`workdir-status ${workDir.valid ? 'valid' : 'invalid'}`}>
            {workDir.valid ? 'Git ready' : 'Invalid path'}
          </span>
        )}
      </div>

      <div className="sidebar-section">
        <label className="section-label">Agents</label>
        <AddAgentForm onAdd={agents.addAgent} />
        <div className="agent-list">
          {agents.agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onRemove={() => agents.removeAgent(agent.id)}
              onReset={() => agents.resetSession(agent.id)}
            />
          ))}
          {agents.agents.length === 0 && (
            <div className="empty-state">No agents added yet</div>
          )}
        </div>
      </div>

      <div className="sidebar-section sidebar-bottom">
        <button
          className="btn btn-undo"
          onClick={workDir.undo}
          disabled={!workDir.valid}
        >
          Undo Last Round
        </button>
        {workDir.undoResult && (
          <span className={`undo-msg ${workDir.undoResult.success ? 'success' : 'error'}`}>
            {workDir.undoResult.success
              ? `Restored to ${workDir.undoResult.restoredTo}`
              : workDir.undoResult.error}
          </span>
        )}
      </div>
    </div>
  );
}
