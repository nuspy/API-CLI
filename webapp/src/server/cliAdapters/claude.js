import { BaseAdapter } from './base.js';

export class ClaudeAdapter extends BaseAdapter {
  constructor() {
    super('claude');
    this.supportsSession = true;
    this._firstInvocation = new Map(); // track per-session first invocation
  }

  buildArgs({ prompt, model, systemPrompt, sessionId }) {
    const args = ['-p', prompt, '--output-format', 'json'];
    if (model) args.push('--model', model);
    // Only pass system prompt on first invocation (not with --resume)
    if (sessionId) {
      args.push('--resume', sessionId);
    } else if (systemPrompt) {
      args.push('--system-prompt', systemPrompt);
    }
    return args;
  }

  parseOutput(raw) {
    try {
      const json = JSON.parse(raw);
      return {
        content: json.result || raw,
        sessionId: json.session_id || null,
      };
    } catch {
      return { content: raw, sessionId: null };
    }
  }
}
