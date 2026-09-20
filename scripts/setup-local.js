const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { loadLocalEnvironment } = require('../src/config/local');

async function setupLocal() {
  const { root } = loadLocalEnvironment();
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name } = process.env;
  if (!require('validator').isEmail(email || '') || !name || !password || password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error('Revisa ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD (8 caracteres mínimo, 72 bytes máximo) en .env.local.');
  }
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    charset: 'utf8mb4', multipleStatements: true, connectTimeout: 10000
  });
  try {
    const schema = fs.readFileSync(path.join(root, 'database/los_magueyes.sql'), 'utf8')
      .replace(/\blos_magueyes\b/g, process.env.DB_NAME);
    const seedIndex = schema.indexOf('INSERT IGNORE INTO categories');
    if (seedIndex < 0) throw new Error('No se encontró el catálogo inicial en el SQL.');
    await connection.query(schema.slice(0, seedIndex));
    const [[row]] = await connection.query('SELECT COUNT(*) AS count FROM products');
    if (Number(row.count) === 0) await connection.query(schema.slice(seedIndex));
    await connection.execute(`INSERT INTO users (name, email, password_hash, role, active)
      VALUES (?, ?, ?, 'admin', 1)
      ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role='admin', active=1`,
    [name, email.trim().toLowerCase(), await bcrypt.hash(password, 12)]);
    console.log('Base local y administrador preparados. Los pedidos y productos existentes se conservan.');
    console.log('Consulta ADMIN_EMAIL y ADMIN_PASSWORD en .env.local para entrar.');
    console.log('Ahora ejecuta npm start y abre ' + process.env.APP_URL + '/auth/login');
  } finally {
    await connection.end();
  }
}
if (require.main === module) setupLocal().catch(error => {
  console.error('No se pudo preparar el entorno local:', error.message);
  console.error('Inicia MySQL en XAMPP y revisa DB_PORT, DB_USER y DB_PASSWORD en .env.local.');
  process.exitCode = 1;
});
module.exports = { setupLocal };
