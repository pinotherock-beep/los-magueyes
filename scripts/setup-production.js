require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { validateProductionEnvironment } = require('../src/config/environment');

async function setupProduction() {
  process.env.NODE_ENV = 'production';
  validateProductionEnvironment();
  const { ADMIN_NAME: name, ADMIN_EMAIL: rawEmail, ADMIN_PASSWORD: password } = process.env;
  if (!name || !validator.isEmail(rawEmail || '') || !password || password.length < 12 || Buffer.byteLength(password) > 72 || /admin123|cambia|password|contraseña/i.test(password)) {
    throw new Error('Configura ADMIN_NAME, ADMIN_EMAIL y una ADMIN_PASSWORD propia de 12 caracteres mínimo y 72 bytes máximo.');
  }
  const { connectionOptions, pool } = require('../src/config/database');
  let connection;
  try {
    // El proveedor crea la base; no se necesitan permisos CREATE DATABASE.
    connection = await mysql.createConnection({ ...connectionOptions, multipleStatements: true });
    const schema = fs.readFileSync(path.join(__dirname, '../database/los_magueyes.sql'), 'utf8')
      .replace(/^CREATE DATABASE[^\n]*\nUSE[^\n]*\n/m, '');
    const split = schema.indexOf('INSERT IGNORE INTO categories');
    if (split < 0) throw new Error('No se encontró el catálogo inicial.');
    await connection.query(schema.slice(0, split));
    const [[row]] = await connection.query('SELECT COUNT(*) AS count FROM products');
    if (Number(row.count) === 0) await connection.query(schema.slice(split));
    await connection.execute(`INSERT INTO users (name, email, password_hash, role, active)
      VALUES (?, ?, ?, 'admin', 1)
      ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role='admin', active=1`,
      [name, rawEmail.trim().toLowerCase(), await bcrypt.hash(password, 12)]);
    console.log('Tablas y administrador preparados; productos y pedidos existentes conservados.');
  } finally {
    if (connection) await connection.end();
    await pool.end();
  }
}
if (require.main === module) setupProduction().catch(error => {
  console.error('No se pudo preparar producción:', error.message);
  process.exitCode = 1;
});
module.exports = { setupProduction };
