function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Inicia sesión para entrar al panel.' };
    return res.redirect('/auth/login');
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('errors/error', {
      title: 'Acceso denegado',
      status: 403,
      message: 'No tienes permisos para realizar esta acción.'
    });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
