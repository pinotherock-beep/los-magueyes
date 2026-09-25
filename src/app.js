const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const MySQLSessionStore = require('./config/sessionStore');
const { sessionSecret } = require('./config/environment');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');
const docsRoutes = require('./routes/docsRoutes');
const openapi = require('./docs/openapi');
const { notFound, errorHandler } = require('./middleware/errors');
const { exposeCsrfToken, csrfProtection, sameOrigin, noStore } = require('./middleware/security');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionStore = process.env.NODE_ENV === 'test' ? undefined : new MySQLSessionStore();
app.locals.sessionStore = sessionStore;

app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
app.set('view engine', 'ejs');
app.set('views', process.env.NETLIFY === 'true' ? path.join(process.cwd(), 'views') : path.join(__dirname, '..', 'views'));
app.use(noStore);

app.use(helmet({
  // Los formularios HTML deben conservar Origin para validar su procedencia.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS === 'true'
  } : false
}));
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use((req, res, next) => {
  Object.assign(res.locals, { user: null, currentPath: req.path, flash: null, csrfToken: '' });
  next();
});

app.use(express.urlencoded({ extended: false, limit: '25kb' }));
app.use(express.json({ limit: '25kb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { dotfiles: 'deny', maxAge: '1d' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.path === '/health',
  message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.'
});
app.use(globalLimiter);

app.use(session({
  name: 'los_magueyes.sid',
  secret: sessionSecret(),
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    priority: 'high',
    maxAge: 1000 * 60 * 60 * 4
  }
}));

app.use(exposeCsrfToken);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use(sameOrigin);
app.use(csrfProtection);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos. Intenta nuevamente en 15 minutos.'
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Se alcanzó el límite temporal de pedidos. Intenta nuevamente en unos minutos.' }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'los-magueyes-web' }));
app.use('/api-docs', docsRoutes(openapi, { csrfEnabled: true }));
app.use('/', publicRoutes);
app.use('/auth', noStore, authLimiter, authRoutes);
app.use('/admin', noStore, adminRoutes);
app.use('/api/orders', orderLimiter);
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
