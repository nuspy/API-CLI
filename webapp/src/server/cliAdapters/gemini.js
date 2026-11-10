import { BaseAdapter } from './base.js';

export class GeminiAdapter extends BaseAdapter {
  constructor() {
    super('gemini');
    this.supportsSession = true;
  }

  buildArgs({ prompt, model, systemPrompt, sessionId }) {
    // Prepend system prompt for first invocation (no session)
    const fullPrompt = (!sessionId && systemPrompt)
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const args = ['-p', fullPrompt, '-o', 'json'];
    if (model) args.push('--model', model);
    if (sessionId) args.push('--resume', sessionId);
    return args;
  }

  parseOutput(raw) {
    try {
      const json = JSON.parse(raw);
      return {
        content: json.result || json.response || json.text || raw,
        sessionId: json.session_id || null,
      };
    } catch {
      // Fallback to raw text if JSON parsing fails
      return { content: raw.trim(), sessionId: null };
    }
  }
}
