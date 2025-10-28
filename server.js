require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sessionManager = require('./services/sessionManager');
const intentDetector = require('./services/intentDetector');
const memoryManager = require('./services/memoryManager');
const ragRetriever = require('./services/ragRetriever');
const llmService = require('./services/llmService');
const escalationService = require('./services/escalationService');

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

// Initialize RAG retriever
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
app.post('/api/session', (req, res) => {
  try {
    const { name, studentNumber, chatId } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    const session = sessionManager.createSession(name, studentNumber, chatId);

    res.json({
      sessionId: session.sessionId,
      userType: session.userType,
      studentInfo: session.studentInfo,
      greeting: `Hi ${name}! I'm Mara, your McMaster Remote Assistant. How can I help you today?`
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

    // Step 6: Store conversation in memory
    memoryManager.storeMessage(session.sessionId, 'user', message);
    memoryManager.storeMessage(session.sessionId, 'assistant', response);

    // Step 7: Save session summary for chat ID continuity
    if (conversationHistory.length > 5) {
      const summary = await memoryManager.summarizeConversation(
        session.sessionId,
        llmService.openai
      );
      sessionManager.saveChatIdSession(session.chatId, {
        summary,
        lastInteraction: new Date().toISOString()
      });
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
