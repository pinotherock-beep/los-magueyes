const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function needsCsrfToken(req) {
  return Boolean(req.session.user)
    || req.path === '/menu'
    || req.path === '/auth/login'
    || req.path === '/api-docs'
    || req.path === '/api-docs/'
    || req.path.startsWith('/admin');
}

function exposeCsrfToken(req, res, next) {
  if (needsCsrfToken(req) && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken || '';
  next();
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const expected = req.session.csrfToken;
  const received = req.get('x-csrf-token') || req.body?._csrf;
  if (typeof expected === 'string' && typeof received === 'string') {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (expectedBuffer.length === receivedBuffer.length
      && crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return next();
    }
  }

  const error = new Error('La sesión del formulario venció. Recarga la página e inténtalo de nuevo.');
  error.status = 403;
  return next(error);
}

function sameOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next();

  let expectedOrigin;
  try {
    // En local se valida contra el host realmente abierto en el navegador.
    // Producción conserva el origen HTTPS configurado.
    expectedOrigin = process.env.NODE_ENV === 'production' && process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : `${req.protocol}://${req.get('host')}`;
  } catch {
    const error = new Error('La dirección APP_URL no es válida.');
    error.status = 500;
    return next(error);
  }

  if (origin !== expectedOrigin) {
    const error = new Error('Origen de solicitud no permitido.');
    error.status = 403;
    return next(error);
  }
  return next();
}

function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
}

module.exports = { exposeCsrfToken, csrfProtection, sameOrigin, noStore };
