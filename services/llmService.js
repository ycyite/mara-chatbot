const OpenAI = require('openai');
const systemPrompts = require('../utils/systemPrompts');

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate response using GPT-4
   */
  async generateResponse({
    message,
    context,
    history,
    intent,
    studentInfo,
    session,
    escalationInfo
  }) {
    try {
      // Build system prompt based on intent and emotional state
      const systemPrompt = systemPrompts.buildSystemPrompt({
        intent: intent.intent,
        emotionalState: intent.emotionalState,
        studentInfo,
        context,
        escalationInfo,
        userType: session.userType
      });

      // Build message array
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history (last 10 messages)
      if (history && history.length > 0) {
        messages.push(...history.slice(-10));
      }

      // Add current message
      messages.push({ role: 'user', content: message });

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: messages
        // GPT-5 only supports default temperature (1) - custom values not allowed
        // max_tokens removed for unlimited output (uses model's maximum: 128,000 tokens)
        // presence_penalty and frequency_penalty removed - not supported by GPT-5
      });

      let responseText = response.choices[0].message.content;

      // Post-process response
      responseText = this.postProcessResponse(responseText, intent, escalationInfo, session);

      return responseText;
    } catch (error) {
      console.error('LLM generation error:', error);
      return this.getFallbackResponse(intent.emotionalState);
    }
  }

  /**
   * Post-process response to add chat ID and ensure formatting
   */
  postProcessResponse(response, intent, escalationInfo, session) {
    let processed = response;

    // Add escalation info if needed
    if (escalationInfo && !processed.includes(escalationInfo.email)) {
      const escalationService = require('./escalationService');
      processed += '\n\n' + escalationService.formatContactInfo(escalationInfo);
    }

    // Add chat ID at the end if this is a new session
    if (session.chatId && !processed.includes(`Chat ID: ${session.chatId}`)) {
      processed += `\n\n📋 **Your Chat ID is: ${session.chatId}**\nPlease save this to continue our conversation later.`;
    }

    return processed;
  }

  /**
   * Get fallback response if API fails
   */
  getFallbackResponse(emotionalState) {
    if (emotionalState === 'crisis') {
      return `I want to make sure you get the support you need right away. Please contact McMaster's Student Wellness Centre:

📞 **Crisis Support**
- Phone: 905-525-9140 ext. 27700
- 24/7 Crisis Line: 1-866-925-5454
- Available: Immediate support

You can also reach out to Good2Talk (post-secondary student helpline):
- Phone: 1-866-925-5454
- Available 24/7

Please reach out - you don't have to go through this alone.`;
    }

    if (emotionalState === 'stressed') {
      return `I understand this is challenging. Let me connect you with someone who can help better. Please reach out to the Student Wellness Centre at wellness@mcmaster.ca or call 905-525-9140 ext. 27700. They're available 8am-10pm daily.`;
    }

    return `I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact McMaster Student Services at student.services@mcmaster.ca for immediate assistance.`;
  }

  /**
   * Validate API key is configured
   */
  validateConfiguration() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured. Please add it to your .env file.');
    }
  }
}

module.exports = new LLMService();
