function notFound(req, res) {
  res.status(404).render('errors/error', {
    title: 'Página no encontrada',
    status: 404,
    message: 'La dirección solicitada no existe.'
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 'ER_DUP_ENTRY') { error.status = 409; error.message = 'Ya existe un producto con ese nombre en la categoría.'; }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') { error.status = 422; error.message = 'La categoría o el producto seleccionado ya no existe.'; }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({
      message: status === 500 ? 'Ocurrió un error inesperado.' : error.message
    });
  }
  return res.status(status).render('errors/error', {
    title: 'Error',
    status,
    message: status === 500 ? 'Ocurrió un error inesperado.' : error.message
  });
}

module.exports = { notFound, errorHandler };
