import { spawn } from 'child_process';

/**
 * Escape an argument for safe shell usage.
 * Required because spawn({shell:true}) joins args with spaces — no quoting.
 */
function escapeShellArg(arg) {
  if (typeof arg !== 'string') return String(arg);
  if (process.platform === 'win32') {
    // cmd.exe: wrap in double quotes, escape internal double quotes
    return `"${arg.replace(/"/g, '""')}"`;
  }
  // Unix sh: wrap in single quotes, escape internal single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

export class BaseAdapter {
  constructor(command) {
    this.command = command;
    this.supportsSession = false;
    this.inputViaPipe = false;
  }

  /**
   * Build command-line arguments.
   * Subclasses override this.
   */
  buildArgs({ prompt, model, systemPrompt, sessionId }) {
    throw new Error('buildArgs must be implemented');
  }

  /**
   * Parse raw stdout output into { content, sessionId? }
   * Subclasses override this.
   */
  parseOutput(raw) {
    return { content: raw, sessionId: null };
  }

  /**
   * Invoke the CLI tool.
   * Returns { pid, result: { content, sessionId? } }
   */
  invoke({ prompt, model, systemPrompt, sessionId, workDir, timeout = 300000, onPid }) {
    return new Promise((resolve, reject) => {
      const args = this.buildArgs({ prompt, model, systemPrompt, sessionId });

      const proc = spawn(this.command, args.map(escapeShellArg), {
        cwd: workDir || process.cwd(),
        stdio: this.inputViaPipe ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      if (onPid) onPid(proc.pid);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      // Write prompt to stdin for pipe-based tools
      if (this.inputViaPipe && prompt) {
        proc.stdin.write(prompt);
        proc.stdin.end();
      }

      const timer = setTimeout(() => {
        try { proc.kill('SIGTERM'); } catch {}
        reject(new Error(`Agent timed out after ${timeout / 1000}s`));
      }, timeout);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0 && !stdout.trim()) {
          reject(new Error(stderr || `Process exited with code ${code}`));
          return;
        }
        try {
          const result = this.parseOutput(stdout);
          resolve({ pid: proc.pid, result });
        } catch (err) {
          reject(err);
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
