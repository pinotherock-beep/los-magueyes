const session = require('express-session');
const { pool } = require('./database');

class MySQLSessionStore extends session.Store {
  async initialize() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL PRIMARY KEY,
        expires BIGINT UNSIGNED NOT NULL,
        data MEDIUMTEXT NOT NULL,
        INDEX idx_sessions_expires (expires)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool.execute('DELETE FROM sessions WHERE expires <= ?', [Date.now()]);
    this.cleanupTimer = setInterval(() => {
      pool.execute('DELETE FROM sessions WHERE expires <= ?', [Date.now()]).catch(console.error);
    }, 15 * 60 * 1000);
    this.cleanupTimer.unref();
  }

  get(sessionId, callback) {
    pool.execute('SELECT data FROM sessions WHERE session_id = ? AND expires > ? LIMIT 1', [sessionId, Date.now()])
      .then(([rows]) => callback(null, rows[0] ? JSON.parse(rows[0].data) : null))
      .catch(callback);
  }

  set(sessionId, sessionData, callback = () => {}) {
    const expires = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires).getTime()
      : Date.now() + 4 * 60 * 60 * 1000;
    this.cleanupExpired()
      .then(() => pool.execute(`
      INSERT INTO sessions (session_id, expires, data) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE expires = VALUES(expires), data = VALUES(data)
    `, [sessionId, expires, JSON.stringify(sessionData)]))
      .then(() => callback(null))
      .catch(callback);
  }

  async cleanupExpired() {
    if (Date.now() < (this.nextCleanup || 0)) return;
    this.nextCleanup = Date.now() + 15 * 60 * 1000;
    try {
      await pool.execute('DELETE FROM sessions WHERE expires <= ? LIMIT 500', [Date.now()]);
    } catch (error) {
      this.nextCleanup = 0;
      throw error;
    }
  }

  destroy(sessionId, callback = () => {}) {
    pool.execute('DELETE FROM sessions WHERE session_id = ?', [sessionId])
      .then(() => callback(null))
      .catch(callback);
  }

  touch(sessionId, sessionData, callback = () => {}) {
    this.set(sessionId, sessionData, callback);
  }
}

module.exports = MySQLSessionStore;
