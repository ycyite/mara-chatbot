const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');

// Session cache - expires after 24 hours
const sessionCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
const chatIdMap = new NodeCache({ stdTTL: 2592000 }); // 30 days for chat IDs

class SessionManager {
  /**
   * Create a new session
   */
  createSession(name, studentNumber, chatId = null) {
    const sessionId = uuidv4();

    // If chat ID provided, try to get previous session data
    let previousSession = null;
    if (chatId) {
      previousSession = chatIdMap.get(chatId);
    }

    const session = {
      sessionId,
      name: name || (previousSession ? previousSession.name : ''),
      studentNumber: studentNumber || (previousSession ? previousSession.studentNumber : ''),
      chatId,
      userType: this.determineUserType(studentNumber || (previousSession ? previousSession.studentNumber : '')),
      studentInfo: this.getStudentInfo(studentNumber || (previousSession ? previousSession.studentNumber : '')),
      createdAt: new Date().toISOString(),
      conversationHistory: [],
      previousContext: previousSession ? previousSession.summary : null
    };

    sessionCache.set(sessionId, session);

    return session;
  }

  /**
   * Get existing session or create new one
   */
  getOrCreateSession(sessionId, name, studentNumber, chatId) {
    if (sessionId) {
      const existing = sessionCache.get(sessionId);
      if (existing) {
        return existing;
      }
    }
    return this.createSession(name, studentNumber, chatId);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return sessionCache.get(sessionId);
  }

  /**
   * Update session data
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (session) {
      Object.assign(session, updates);
      sessionCache.set(sessionId, session);
      return session;
    }
    return null;
  }

  /**
   * Generate unique chat ID
   */
  generateChatId() {
    const chatId = 40000 + Math.floor(Math.random() * 10000);
    return chatId.toString();
  }

  /**
   * Save session summary with chat ID for future retrieval
   */
  saveChatIdSession(chatId, sessionData) {
    // Store essential session data for continuity
    const dataToStore = {
      chatId,
      name: sessionData.name,
      studentNumber: sessionData.studentNumber,
      summary: sessionData.summary,
      lastInteraction: sessionData.lastInteraction || new Date().toISOString()
    };
    chatIdMap.set(chatId, dataToStore);
  }

  /**
   * Determine if user is current student or prospective
   */
  determineUserType(studentNumber) {
    // Simple validation - real system would check against database
    if (!studentNumber || studentNumber.length < 9) {
      return 'prospective';
    }
    return 'current';
  }

  /**
   * Get student information (mock - would query real database)
   */
  getStudentInfo(studentNumber) {
    // Mock data for demonstration
    if (studentNumber === '410622548') {
      return {
        level: 4,
        semester: 'Fall 2025',
        courseCount: 5,
        program: 'Software Engineering',
        enrollmentStatus: 'full-time'
      };
    }

    // Default for other students
    return {
      level: 'Unknown',
      semester: 'Unknown',
      courseCount: 0,
      program: 'Unknown',
      enrollmentStatus: 'unknown'
    };
  }

  /**
   * Clear expired sessions (called periodically)
   */
  clearExpiredSessions() {
    // NodeCache handles this automatically with TTL
    console.log('Session cleanup completed');
  }
}

module.exports = new SessionManager();
