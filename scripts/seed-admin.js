require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');

async function seedAdmin() {
  try {
    const name = process.env.ADMIN_NAME || 'Administrador';
    const email = (process.env.ADMIN_EMAIL || 'admin@losmagueyes.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 8 || Buffer.byteLength(password) > 72) throw new Error('Configura ADMIN_PASSWORD: de 8 caracteres a 72 bytes.');
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.ADMIN_NAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        throw new Error('ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios en producción.');
      }
      if (password.length < 12 || /admin123|cambia|password|contraseña/i.test(password)) {
        throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres y no ser una contraseña de ejemplo.');
      }
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await sequelize.query(`
      INSERT INTO users (name, email, password_hash, role, active, created_at, updated_at)
      VALUES (:name, :email, :passwordHash, 'admin', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=:name, password_hash=:passwordHash, role='admin', active=1, updated_at=NOW()
    `, { replacements: { name, email, passwordHash } });
    console.log(`Administrador listo: ${email}`);
  } catch (error) {
    console.error('No se pudo crear el administrador:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedAdmin();
