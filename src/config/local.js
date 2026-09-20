const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '../..');
const localPath = path.join(root, '.env.local');

function loadLocalEnvironment() {
  if (!fs.existsSync(localPath)) {
    const original = path.join(root, '.env');
    const previous = fs.existsSync(original) ? dotenv.parse(fs.readFileSync(original)) : {};
    const values = {
      NODE_ENV: 'development', HOST: '127.0.0.1', PORT: '3000',
      APP_URL: 'http://127.0.0.1:3000', DB_HOST: '127.0.0.1',
      DB_PORT: previous.DB_PORT || '3306', DB_NAME: previous.DB_NAME || 'los_magueyes',
      DB_USER: previous.DB_USER || 'root', DB_PASSWORD: previous.DB_PASSWORD || '',
      DB_SSL: 'false', SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
      ADMIN_NAME: previous.ADMIN_NAME || 'Administrador',
      ADMIN_EMAIL: previous.ADMIN_EMAIL || 'admin@losmagueyes.com',
      ADMIN_PASSWORD: previous.ADMIN_PASSWORD || crypto.randomBytes(15).toString('base64url')
    };
    fs.writeFileSync(localPath, Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n', { mode: 0o600 });
  }
  const values = dotenv.parse(fs.readFileSync(localPath));
  Object.assign(process.env, values, { NODE_ENV: 'development', HOST: '127.0.0.1', DB_SSL: 'false' });
  if (!['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST)) {
    throw new Error('Para uso local, DB_HOST en .env.local debe ser localhost, 127.0.0.1 o ::1.');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(process.env.DB_NAME || '')) throw new Error('DB_NAME debe contener solamente letras, números o guiones bajos.');
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe estar entre 1 y 65535.');
  process.env.APP_URL = `http://127.0.0.1:${port}`;
  return { root, localPath };
}
module.exports = { loadLocalEnvironment };
