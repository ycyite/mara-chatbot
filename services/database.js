const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      // Check if DATABASE_URL is configured
      if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL not configured - running without persistence');
        return false;
      }

      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      await this.pool.query('SELECT NOW()');
      console.log('✓ Database connected');

      // Create tables if they don't exist
      await this.createTables();
      return true;
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      console.warn('⚠️  Running without database persistence');
      return false;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        student_number VARCHAR(50),
        chat_id VARCHAR(50),
        user_type VARCHAR(50),
        student_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES sessions(session_id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        intent VARCHAR(50),
        emotional_state VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createChatHistoryTable = `
      CREATE TABLE IF NOT EXISTS chat_history (
        chat_id VARCHAR(50) PRIMARY KEY,
        session_summary TEXT,
        last_session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_chat_id ON sessions(chat_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
    `;

    try {
      await this.pool.query(createSessionsTable);
      await this.pool.query(createMessagesTable);
      await this.pool.query(createChatHistoryTable);
      await this.pool.query(createIndexes);
      console.log('✓ Database tables initialized');
    } catch (error) {
      console.error('Error creating tables:', error.message);
      throw error;
    }
  }

  /**
   * Check if database is available
   */
  isAvailable() {
    return this.pool !== null;
  }

  /**
   * Save session to database
   */
  async saveSession(session) {
    if (!this.isAvailable()) return null;

    try {
      const query = `
        INSERT INTO sessions (session_id, name, student_number, chat_id, user_type, student_info, last_active)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (session_id)
        DO UPDATE SET last_active = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        session.sessionId,
        session.name,
        session.studentNumber || null,
        session.chatId || null,
        session.userType,
        JSON.stringify(session.studentInfo)
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving session:', error.message);
      return null;
    }
  }

  /**
   * Get session from database
   */
  async getSession(sessionId) {
    if (!this.isAvailable()) return null;

    try {
      const query = `
        SELECT * FROM sessions
        WHERE session_id = $1
        AND last_active > NOW() - INTERVAL '24 hours';
      `;

      const result = await this.pool.query(query, [sessionId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        sessionId: row.session_id,
        name: row.name,
        studentNumber: row.student_number,
        chatId: row.chat_id,
        userType: row.user_type,
        studentInfo: row.student_info,
        createdAt: row.created_at,
        lastActive: row.last_active
      };
    } catch (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
  }

  /**
   * Save message to database
   */
  async saveMessage(sessionId, role, content, intent = null, emotionalState = null) {
    if (!this.isAvailable()) return null;

    try {
      const query = `
        INSERT INTO messages (session_id, role, content, intent, emotional_state)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;

      const values = [sessionId, role, content, intent, emotionalState];
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error.message);
      return null;
    }
  }

  /**
   * Get conversation history from database
   */
  async getMessages(sessionId, limit = 10) {
    if (!this.isAvailable()) return [];

    try {
      const query = `
        SELECT * FROM messages
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT $2;
      `;

      const result = await this.pool.query(query, [sessionId, limit]);
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting messages:', error.message);
      return [];
    }
  }

  /**
   * Save chat history summary
   */
  async saveChatHistory(chatId, summary, sessionId) {
    if (!this.isAvailable()) return null;

    try {
      const query = `
        INSERT INTO chat_history (chat_id, session_summary, last_session_id, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (chat_id)
        DO UPDATE SET
          session_summary = $2,
          last_session_id = $3,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const result = await this.pool.query(query, [chatId, summary, sessionId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving chat history:', error.message);
      return null;
    }
  }

  /**
   * Get chat history by chat ID
   */
  async getChatHistory(chatId) {
    if (!this.isAvailable()) return null;

    try {
      const query = `SELECT * FROM chat_history WHERE chat_id = $1;`;
      const result = await this.pool.query(query, [chatId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting chat history:', error.message);
      return null;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(days = 7) {
    if (!this.isAvailable()) return null;

    try {
      const query = `
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(*) as total_messages,
          COUNT(DISTINCT CASE WHEN role = 'user' THEN session_id END) as active_users,
          intent,
          emotional_state,
          COUNT(*) as count
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY intent, emotional_state
        ORDER BY count DESC;
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting analytics:', error.message);
      return null;
    }
  }

  /**
   * Clean up old sessions (older than 30 days)
   */
  async cleanupOldData() {
    if (!this.isAvailable()) return;

    try {
      const query = `
        DELETE FROM sessions
        WHERE last_active < NOW() - INTERVAL '30 days';
      `;

      const result = await this.pool.query(query);
      console.log(`Cleaned up ${result.rowCount} old sessions`);
    } catch (error) {
      console.error('Error cleaning up old data:', error.message);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = new Database();
