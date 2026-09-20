const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const DUMMY_PASSWORD_HASH = '$2b$12$OhFgPG4N39nTq/MxiR2ZKOe1Nc.3stTwUow7ny1d/4QqPRUHI5PXW';

function regenerateSession(req) {
  return new Promise((resolve, reject) => req.session.regenerate(error => (error ? reject(error) : resolve())));
}

function saveSession(req) {
  return new Promise((resolve, reject) => req.session.save(error => (error ? reject(error) : resolve())));
}

exports.showLogin = (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  return res.render('auth/login', { title: 'Iniciar sesión', errors: [], values: {} });
};

exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      title: 'Iniciar sesión', errors: errors.array(), values: { email: req.body.email }
    });
  }

  const users = await sequelize.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = :email AND active = 1 LIMIT 1',
    { replacements: { email: req.body.email } }
  );
  const user = users[0];
  const passwordMatches = await bcrypt.compare(req.body.password, user?.password_hash || DUMMY_PASSWORD_HASH);
  const valid = Boolean(user) && passwordMatches;
  if (!valid) {
    return res.status(401).render('auth/login', {
      title: 'Iniciar sesión',
      errors: [{ msg: 'Correo o contraseña incorrectos.' }],
      values: { email: req.body.email }
    });
  }

  await regenerateSession(req);
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  await saveSession(req);
  return res.redirect('/admin');
});

exports.logout = asyncHandler(async (req, res) => {
  await new Promise((resolve, reject) => req.session.destroy(error => (error ? reject(error) : resolve())));
  res.clearCookie('los_magueyes.sid', { path: '/' });
  return res.redirect('/');
});
