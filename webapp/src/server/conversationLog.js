const MAX_HISTORY_CHARS = 100000;

class ConversationLog {
  constructor() {
    this.messages = [];
  }

  addMessage(msg) {
    this.messages.push(msg);
  }

  clear() {
    this.messages = [];
  }

  /**
   * Build the prompt for a given agent.
   * For session-based agents (claude, droid): only the latest context since their last response.
   * For non-session agents (codex, gemini): full conversation history.
   */
  buildPromptFor(agent) {
    // First message: just send raw user content (no wrapping needed)
    if (this.messages.length === 1 && this.messages[0].role === 'user') {
      return this.messages[0].content;
    }

    const supportsSession = agent.appType === 'claude' || agent.appType === 'droid' || agent.appType === 'gemini';

    if (supportsSession && agent.sessionId) {
      // Only send new messages since agent's last response
      return this._buildIncrementalPrompt(agent.id);
    }
    // Full history
    return this._buildFullPrompt(agent.id);
  }

  _buildIncrementalPrompt(agentId) {
    // Find the last message from this agent
    let lastIdx = -1;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].agentId === agentId) {
        lastIdx = i;
        break;
      }
    }

    const newMessages = this.messages.slice(lastIdx + 1);
    if (newMessages.length === 0) return '';

    return newMessages
      .map((m) => this._formatMessage(m))
      .join('\n');
  }

  _buildFullPrompt(agentId) {
    let history = this.messages
      .map((m) => this._formatMessage(m))
      .join('\n');

    // Truncate if too long
    if (history.length > MAX_HISTORY_CHARS) {
      history = '...[conversation truncated]...\n' +
        history.slice(history.length - MAX_HISTORY_CHARS);
    }

    return `[Conversation so far]\n${history}\n[Your turn - respond or [PASS]]`;
  }

  _formatMessage(msg) {
    if (msg.role === 'user') {
      return `User: ${msg.content}`;
    }
    return `${msg.agentName || msg.agentId}: ${msg.content}`;
  }
}

export const conversationLog = new ConversationLog();
