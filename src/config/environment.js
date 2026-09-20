const PLACEHOLDER_PATTERN = /cambia|change|ejemplo|example|solo-desarrollo|docker-cambiar/i;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production'
    && (!secret || secret.length < 32 || PLACEHOLDER_PATTERN.test(secret))) {
    throw new Error('SESSION_SECRET debe tener al menos 32 caracteres aleatorios y no ser un valor de ejemplo.');
  }
  return secret || 'solo-desarrollo-cambiar-en-produccion';
}

function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = ['APP_URL', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'SESSION_SECRET'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) {
    throw new Error(`Faltan variables obligatorias de producción: ${missing.join(', ')}.`);
  }

  let appUrl;
  try {
    appUrl = new URL(process.env.APP_URL);
  } catch {
    throw new Error('APP_URL debe ser una dirección web completa, por ejemplo https://www.tudominio.com.');
  }
  if (appUrl.protocol !== 'https:') {
    throw new Error('APP_URL debe usar HTTPS en producción.');
  }

  sessionSecret();
}

module.exports = { sessionSecret, validateProductionEnvironment };
