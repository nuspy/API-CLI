import { useState, useEffect, useCallback } from 'react';

export function useWorkDir(ws) {
  const [workDir, setWorkDir] = useState('');
  const [valid, setValid] = useState(false);
  const [undoResult, setUndoResult] = useState(null);

  useEffect(() => {
    const unsubs = [
      ws.registerHandler('work_dir', (msg) => {
        setWorkDir(msg.path || '');
        setValid(msg.valid);
      }),
      ws.registerHandler('undo_result', (msg) => {
        setUndoResult(msg);
        // Auto-clear after 3s
        setTimeout(() => setUndoResult(null), 3000);
      }),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [ws]);

  const setDir = useCallback((path) => {
    ws.send('set_work_dir', { path });
  }, [ws]);

  const undo = useCallback(() => {
    ws.send('undo');
  }, [ws]);

  return { workDir, valid, undoResult, setDir, undo };
}
