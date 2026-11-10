import React from 'react';

export default function RoundIndicator({ isDiscussing, currentRound, stoppedReason }) {
  if (isDiscussing) {
    return (
      <div className="round-indicator active">
        <span className="pulse" />
        Round {currentRound}/10
      </div>
    );
  }

  if (stoppedReason) {
    const labels = {
      converged: 'Converged',
      user: 'Stopped by user',
      max_rounds: 'Max rounds reached',
    };
    return (
      <div className="round-indicator stopped">
        {labels[stoppedReason] || stoppedReason} (round {currentRound})
      </div>
    );
  }

  return (
    <div className="round-indicator ready">
      Ready
    </div>
  );
}
