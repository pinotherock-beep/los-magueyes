const mysql = require('mysql2/promise');

const connectionOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'los_magueyes',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || (process.env.NETLIFY === 'true' ? 2 : 10),
  maxIdle: 1,
  idleTimeout: 60000,
  queueLimit: 0,
  namedPlaceholders: true,
  charset: 'utf8mb4',
  connectTimeout: 10000,
  ...(process.env.DB_SSL === 'true' && {
    ssl: { rejectUnauthorized: true, ...(process.env.DB_SSL_CA && { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') }) }
  })
};

const pool = mysql.createPool(connectionOptions);

const sequelize = {
  async query(sql, options = {}) {
    const executor = options.transaction || pool;
    const [result] = await executor.execute(sql, options.replacements || {});
    if (Array.isArray(result)) return result;
    if (Object.prototype.hasOwnProperty.call(result, 'insertId')) return [result.insertId];
    return result;
  },
  async transaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  async authenticate() {
    await pool.query('SELECT 1');
  },
  async close() {
    await pool.end();
  }
};

async function testConnection() {
  await sequelize.authenticate();
  console.log('Conexión correcta con MySQL.');
}

module.exports = { sequelize, testConnection, pool };
module.exports.connectionOptions = connectionOptions;
