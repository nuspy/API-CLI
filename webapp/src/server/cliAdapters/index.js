import { ClaudeAdapter } from './claude.js';
import { CodexAdapter } from './codex.js';
import { GeminiAdapter } from './gemini.js';
import { DroidAdapter } from './droid.js';

const adapters = {
  claude: () => new ClaudeAdapter(),
  codex: () => new CodexAdapter(),
  gemini: () => new GeminiAdapter(),
  droid: () => new DroidAdapter(),
};

export function createAdapter(appType) {
  const factory = adapters[appType];
  if (!factory) throw new Error(`Unknown adapter type: ${appType}`);
  return factory();
}
