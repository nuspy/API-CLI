import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class GitCheckpoint {
  constructor() {
    this._workDir = '';
    this._valid = false;
    this._checkpoints = []; // stack of commit hashes
  }

  getWorkDir() {
    return this._workDir;
  }

  isValid() {
    return this._valid;
  }

  setWorkDir(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) {
      this._valid = false;
      this._workDir = dirPath || '';
      return { path: this._workDir, valid: false };
    }

    this._workDir = dirPath;
    this._checkpoints = [];

    try {
      // Check if it's a git repo
      execSync('git rev-parse --git-dir', { cwd: dirPath, stdio: 'pipe' });
      this._valid = true;
    } catch {
      // Init git if not present
      try {
        execSync('git init', { cwd: dirPath, stdio: 'pipe' });
        execSync('git add -A', { cwd: dirPath, stdio: 'pipe' });
        execSync('git commit -m "warroom: initial" --allow-empty', { cwd: dirPath, stdio: 'pipe' });
        this._valid = true;
      } catch (err) {
        this._valid = false;
        return { path: this._workDir, valid: false, error: err.message };
      }
    }

    // Create warroom branch
    try {
      const branch = `warroom-${Date.now()}`;
      execSync(`git checkout -b ${branch}`, { cwd: dirPath, stdio: 'pipe' });
    } catch {
      // May already be on a warroom branch or branch exists
    }

    return { path: this._workDir, valid: this._valid };
  }

  async checkpoint(label) {
    if (!this._valid) return;

    try {
      // Save current hash before committing
      const currentHash = execSync('git rev-parse HEAD', {
        cwd: this._workDir,
        encoding: 'utf-8',
      }).trim();

      execSync('git add -A', { cwd: this._workDir, stdio: 'pipe' });
      execSync(`git commit -m "warroom-checkpoint: ${label}" --allow-empty`, {
        cwd: this._workDir,
        stdio: 'pipe',
      });

      this._checkpoints.push(currentHash);
    } catch (err) {
      console.error('Checkpoint error:', err.message);
    }
  }

  undo() {
    if (!this._valid || this._checkpoints.length === 0) {
      return { success: false, error: 'No checkpoints to undo' };
    }

    const prevHash = this._checkpoints.pop();
    try {
      execSync(`git reset --hard ${prevHash}`, { cwd: this._workDir, stdio: 'pipe' });
      return { success: true, restoredTo: prevHash.slice(0, 8) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const gitCheckpoint = new GitCheckpoint();
