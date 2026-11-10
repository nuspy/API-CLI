import { BaseAdapter } from './base.js';

export class DroidAdapter extends BaseAdapter {
  constructor() {
    super('droid');
    this.supportsSession = true;
  }

  buildArgs({ prompt, model, systemPrompt, sessionId }) {
    // Prepend system prompt for first invocation (no session)
    const fullPrompt = (!sessionId && systemPrompt)
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const args = ['exec', fullPrompt, '-o', 'json'];
    if (model) args.push('-m', model);
    if (sessionId) args.push('-s', sessionId);
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
      return { content: raw.trim(), sessionId: null };
    }
  }
}
