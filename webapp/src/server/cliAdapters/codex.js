import { BaseAdapter } from './base.js';

export class CodexAdapter extends BaseAdapter {
  constructor() {
    super('codex');
    this.supportsSession = false;
    this.inputViaPipe = true;
  }

  buildArgs({ prompt, model, systemPrompt, sessionId }) {
    const args = ['exec', '-'];
    if (model) args.push('--model', model);
    return args;
  }

  /**
   * Override invoke to prepend system prompt to stdin content.
   */
  invoke(opts) {
    if (opts.systemPrompt) {
      opts.prompt = `${opts.systemPrompt}\n\n${opts.prompt}`;
    }
    return super.invoke(opts);
  }

  parseOutput(raw) {
    return { content: raw.trim(), sessionId: null };
  }
}
