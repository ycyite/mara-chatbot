require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sessionManager = require('./services/sessionManager');
const intentDetector = require('./services/intentDetector');
const memoryManager = require('./services/memoryManager');
const ragRetriever = require('./services/ragRetriever');
const llmService = require('./services/llmService');
const escalationService = require('./services/escalationService');
const database = require('./services/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Serve static files (frontend)
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize services
database.initialize().catch(console.error);
ragRetriever.initialize().catch(console.error);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Mara Chatbot API'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Mara - McMaster Remote Assistant',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      chat: 'POST /api/chat',
      session: 'POST /api/session',
      health: 'GET /health'
    }
  });
});

/**
 * Create new session endpoint
 */
app.post('/api/session', async (req, res) => {
  try {
    const { name, studentNumber, chatId } = req.body;

    // If chat ID provided, try to retrieve session from database OR in-memory cache
    let previousContext = null;
    let retrievedName = name;
    let retrievedStudentNumber = studentNumber;

    if (chatId) {
      console.log(`[Session] Chat ID provided: ${chatId}`);

      // Try database first
      if (database.isAvailable()) {
        console.log('[Session] Checking database for Chat ID history...');
        const chatHistory = await database.getChatHistory(chatId);
        if (chatHistory) {
          console.log('[Session] Found chat history in database');
          previousContext = chatHistory.session_summary;
          // Get the last session to retrieve name and student number
          const lastSession = await database.getSession(chatHistory.last_session_id);
          if (lastSession) {
            retrievedName = retrievedName || lastSession.name;
            retrievedStudentNumber = retrievedStudentNumber || lastSession.student_number;
          }
        } else {
          console.log('[Session] No chat history found in database');
        }
      } else {
        // Fallback to in-memory cache
        console.log('[Session] Database not available, checking in-memory cache...');
        const cachedSession = sessionManager.getChatIdSession(chatId);
        if (cachedSession) {
          console.log('[Session] Found chat history in cache:', cachedSession);
          previousContext = cachedSession.summary;
          retrievedName = retrievedName || cachedSession.name;
          retrievedStudentNumber = retrievedStudentNumber || cachedSession.studentNumber;
        } else {
          console.log('[Session] No chat history found in cache');
        }
      }
    }

    if (!retrievedName && !chatId) {
      return res.status(400).json({
        error: 'Name is required for new sessions'
      });
    }

    const session = sessionManager.createSession(retrievedName, retrievedStudentNumber, chatId);

    let greeting = `Hi ${session.name}! I'm Mara, your McMaster Remote Assistant. How can I help you today?`;

    if (chatId && previousContext) {
      greeting = `Welcome back, ${session.name}! I remember our previous conversation. How can I help you today?`;
    }

    // Get message history if continuing from Chat ID
    let messageHistory = [];
    if (chatId) {
      if (database.isAvailable()) {
        // Get from database
        const messages = await database.getSessionMessages(session.sessionId);
        messageHistory = messages || [];
      } else {
        // Get from cache
        const cachedSession = sessionManager.getChatIdSession(chatId);
        messageHistory = cachedSession ? cachedSession.messageHistory : [];
      }
      console.log(`[Session] Retrieved ${messageHistory.length} messages from history`);
    }

    res.json({
      sessionId: session.sessionId,
      userType: session.userType,
      studentInfo: session.studentInfo,
      greeting,
      previousContext: session.previousContext,
      messageHistory
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error.message
    });
  }
});

/**
 * Main chat endpoint
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, name, studentNumber, chatId } = req.body;

    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Get or create session
    let session = sessionManager.getOrCreateSession(sessionId, name, studentNumber, chatId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found. Please start a new session.'
      });
    }

    console.log(`Processing message for session ${session.sessionId}: "${message}"`);

    // Step 1: Detect intent and emotional state
    const conversationHistory = memoryManager.formatHistoryForLLM(session.sessionId, 5);
    const intent = await intentDetector.analyzeIntent(message, conversationHistory);
    console.log('Detected intent:', intent);

    // Step 2: Retrieve relevant knowledge (if needed)
    let context = '';
    if (intent.needsRetrieval) {
      const results = await ragRetriever.search(message, 3);
      context = ragRetriever.formatContext(results);
      console.log(`Retrieved ${results.length} knowledge entries`);
    }

    // Step 3: Check for escalation needs
    let escalationInfo = null;
    if (intent.requiresEscalation || intent.emotionalState === 'crisis') {
      escalationInfo = escalationService.getContact(intent.category, session.userType);
      console.log('Escalation needed:', intent.category);
    }

    // Step 4: Generate chat ID if this is the first interaction
    if (!session.chatId) {
      session.chatId = sessionManager.generateChatId();
      sessionManager.updateSession(session.sessionId, { chatId: session.chatId });
      console.log('Generated chat ID:', session.chatId);
    }

    // Step 5: Generate response using LLM
    const response = await llmService.generateResponse({
      message,
      context,
      history: conversationHistory,
      intent,
      studentInfo: session.studentInfo,
      session,
      escalationInfo
    });

    // Step 6: Store conversation in memory AND database
    memoryManager.storeMessage(session.sessionId, 'user', message);
    memoryManager.storeMessage(session.sessionId, 'assistant', response);

    // Save to database if available
    if (database.isAvailable()) {
      await database.saveSession(session);
      await database.saveMessage(session.sessionId, 'user', message, intent.intent, intent.emotionalState);
      await database.saveMessage(session.sessionId, 'assistant', response);
    }

    // Step 7: Save full conversation history with chat ID after EVERY message
    console.log(`[Chat] Saving conversation history (${conversationHistory.length} messages)...`);

    // Get full message history from memory
    const fullHistory = memoryManager.getFullHistory(session.sessionId);

    // Generate summary only if we have multiple messages
    let summary = '';
    if (conversationHistory.length >= 3) {
      summary = await memoryManager.summarizeConversation(
        session.sessionId,
        llmService.openai
      );
      console.log(`[Chat] Summary generated: ${summary.substring(0, 100)}...`);
    }

    // Save to in-memory cache with full message history
    sessionManager.saveChatIdSession(session.chatId, {
      name: session.name,
      studentNumber: session.studentNumber,
      summary,
      messageHistory: fullHistory,
      lastInteraction: new Date().toISOString()
    });

    // Also save to database if available
    if (database.isAvailable()) {
      console.log('[Chat] Saving to database...');
      await database.saveChatHistory(session.chatId, summary, session.sessionId);
    } else {
      console.log('[Chat] Saved to in-memory cache');
    }

    // Return response
    res.json({
      response,
      sessionId: session.sessionId,
      chatId: session.chatId,
      intent: intent.intent,
      emotionalState: intent.emotionalState,
      escalationRequired: !!escalationInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);

    // Return helpful error message
    res.status(500).json({
      error: 'I apologize, but I encountered an error processing your message.',
      response: `I'm having technical difficulties right now. Please try again in a moment, or contact McMaster Student Services directly at student.services@mcmaster.ca for immediate assistance.`,
      message: error.message
    });
  }
});

/**
 * Get conversation history endpoint
 */
app.get('/api/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = memoryManager.getFullHistory(sessionId);
    const stats = memoryManager.getStats(sessionId);

    res.json({
      history,
      stats
    });
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve history',
      message: error.message
    });
  }
});

/**
 * Get contact information endpoint
 */
app.get('/api/contacts/:category?', (req, res) => {
  try {
    const { category } = req.params;
    const { userType } = req.query;

    if (category) {
      const contact = escalationService.getContact(category, userType);
      res.json(contact);
    } else {
      const contacts = escalationService.getAllContacts(userType);
      res.json(contacts);
    }
  } catch (error) {
    console.error('Contact retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve contacts',
      message: error.message
    });
  }
});

/**
 * Get analytics endpoint
 */
app.get('/api/analytics', async (req, res) => {
  try {
    if (!database.isAvailable()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Analytics require database connection'
      });
    }

    const days = parseInt(req.query.days) || 7;
    const analytics = await database.getAnalytics(days);

    res.json({
      period: `Last ${days} days`,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve analytics',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  Mara - McMaster Remote Assistant API                     ║
║  Server running on port ${PORT}                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}    ║
║  Time: ${new Date().toLocaleString()}                     ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Validate configuration
  try {
    llmService.validateConfiguration();
    console.log('✓ OpenAI API key configured');
  } catch (error) {
    console.error('✗ Configuration error:', error.message);
    console.error('  Please set OPENAI_API_KEY in your .env file');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
