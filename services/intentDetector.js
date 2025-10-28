const OpenAI = require('openai');

class IntentDetector {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze user message to detect intent and emotional state
   */
  async analyzeIntent(message, conversationHistory = []) {
    const systemPrompt = `You are an intent classifier for a university chatbot. Analyze the user's message and return a JSON object with:
- intent: one of ["fee_inquiry", "course_question", "emotional_support", "academic_policy", "prospective_student", "general_inquiry", "technical_support"]
- emotionalState: one of ["neutral", "positive", "stressed", "frustrated", "crisis"]
- needsRetrieval: boolean (true if factual information needed)
- requiresEscalation: boolean (true if human support needed)
- category: relevant department or area
- keywords: array of key terms from message

Emotional state detection:
- "crisis": mentions giving up, suicide, self-harm, severe depression
- "stressed": overwhelmed, exhausted, can't handle, too much pressure
- "frustrated": angry, unfair, annoyed, upset
- "positive": happy, grateful, excited
- "neutral": factual questions without emotion

Return ONLY valid JSON, no other text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Message: "${message}"\n\nConversation context: ${JSON.stringify(conversationHistory.slice(-3))}` }
        ]
        // GPT-5 only supports default temperature (1) - custom values not allowed
        // max_tokens removed for unlimited output
      });

      const result = JSON.parse(response.choices[0].message.content);

      // Fallback to keyword-based detection if needed
      return this.validateAndEnhanceIntent(result, message);
    } catch (error) {
      console.error('Intent detection error:', error);
      // Fallback to rule-based detection
      return this.fallbackIntentDetection(message);
    }
  }

  /**
   * Validate and enhance intent detection results
   */
  validateAndEnhanceIntent(result, message) {
    const lowercaseMsg = message.toLowerCase();

    // Override crisis detection with strict keywords
    const crisisKeywords = ['give up', 'suicide', 'kill myself', 'end it all', 'no point', 'hopeless'];
    if (crisisKeywords.some(keyword => lowercaseMsg.includes(keyword))) {
      result.emotionalState = 'crisis';
      result.requiresEscalation = true;
      result.category = 'mental_health';
    }

    // Enhance fee-related detection
    const feeKeywords = ['fee', 'tuition', 'cost', 'payment', 'charge', 'gym', 'bus pass'];
    if (feeKeywords.some(keyword => lowercaseMsg.includes(keyword))) {
      result.intent = 'fee_inquiry';
      result.needsRetrieval = true;
      result.category = 'fees';
    }

    return result;
  }

  /**
   * Fallback rule-based intent detection
   */
  fallbackIntentDetection(message) {
    const lowercaseMsg = message.toLowerCase();

    let intent = 'general_inquiry';
    let emotionalState = 'neutral';
    let needsRetrieval = true;
    let requiresEscalation = false;
    let category = 'general';

    // Fee-related
    if (lowercaseMsg.match(/fee|tuition|cost|payment|charge/)) {
      intent = 'fee_inquiry';
      category = 'fees';
    }

    // Course-related
    if (lowercaseMsg.match(/course|class|schedule|registration|enroll/)) {
      intent = 'course_question';
      category = 'academics';
    }

    // Emotional keywords
    if (lowercaseMsg.match(/overwhelm|exhaust|stress|can't handle|too much|tired/)) {
      emotionalState = 'stressed';
      intent = 'emotional_support';
      requiresEscalation = true;
      category = 'wellness';
    }

    if (lowercaseMsg.match(/frustrated|angry|unfair|annoyed|upset/)) {
      emotionalState = 'frustrated';
    }

    if (lowercaseMsg.match(/give up|suicide|hopeless|no point/)) {
      emotionalState = 'crisis';
      requiresEscalation = true;
      category = 'mental_health';
    }

    // Prospective student
    if (lowercaseMsg.match(/apply|application|interested in|not a student yet/)) {
      intent = 'prospective_student';
      category = 'admissions';
    }

    const keywords = message.split(' ').filter(word => word.length > 3);

    return {
      intent,
      emotionalState,
      needsRetrieval,
      requiresEscalation,
      category,
      keywords: keywords.slice(0, 5)
    };
  }
}

module.exports = new IntentDetector();
