const NodeCache = require('node-cache');

// Store conversation history with 24-hour TTL
const conversationCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

class MemoryManager {
  /**
   * Store a message in conversation history
   */
  storeMessage(sessionId, role, content) {
    let history = conversationCache.get(sessionId) || [];

    history.push({
      role, // 'user' or 'assistant'
      content,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 messages to prevent context overflow
    if (history.length > 20) {
      history = history.slice(-20);
    }

    conversationCache.set(sessionId, history);
    return history;
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId, lastN = 10) {
    const history = conversationCache.get(sessionId) || [];
    return history.slice(-lastN);
  }

  /**
   * Get full history (for summarization)
   */
  getFullHistory(sessionId) {
    return conversationCache.get(sessionId) || [];
  }

  /**
   * Format history for LLM context
   */
  formatHistoryForLLM(sessionId, lastN = 10) {
    const history = this.getHistory(sessionId, lastN);
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Generate conversation summary
   */
  async summarizeConversation(sessionId, openaiClient) {
    const fullHistory = this.getFullHistory(sessionId);

    if (fullHistory.length === 0) {
      return 'No conversation history';
    }

    const conversationText = fullHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Summarize this conversation in 2-3 sentences, focusing on the main topics discussed and any action items or escalations.'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Summarization error:', error);
      return 'Unable to generate summary';
    }
  }

  /**
   * Clear conversation history (privacy compliance)
   */
  clearHistory(sessionId) {
    conversationCache.del(sessionId);
  }

  /**
   * Get conversation statistics
   */
  getStats(sessionId) {
    const history = this.getFullHistory(sessionId);
    return {
      messageCount: history.length,
      userMessages: history.filter(m => m.role === 'user').length,
      assistantMessages: history.filter(m => m.role === 'assistant').length,
      duration: history.length > 0
        ? new Date(history[history.length - 1].timestamp) - new Date(history[0].timestamp)
        : 0
    };
  }
}

module.exports = new MemoryManager();
