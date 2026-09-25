const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const swaggerUiDist = require('swagger-ui-dist');

module.exports = function docsRoutes(specification, { csrfEnabled = false } = {}) {
  const router = express.Router();
  const dist = swaggerUiDist.getAbsoluteFSPath();
  const root = process.env.NETLIFY === 'true' ? process.cwd() : path.join(__dirname, '..', '..');

  router.get('/openapi.json', (req, res) => res.json(specification));
  // Solo exponemos los archivos que utiliza la interfaz, no todo el paquete.
  for (const file of ['swagger-ui.css', 'swagger-ui-bundle.js']) {
    router.get(`/assets/${file}`, (req, res) => res.sendFile(file, { root: dist }));
  }
  router.get('/assets/initializer.js', (req, res) => res.sendFile('swagger-ui.js', { root: path.join(root, 'public/js') }));
  router.get('/assets/docs.css', (req, res) => res.sendFile('swagger-docs.css', { root: path.join(root, 'public/css') }));

  // Swagger usa estilos en línea. La excepción solo se aplica a su página;
  // los scripts y las conexiones continúan restringidos al mismo origen.
  const docsCsp = helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], baseUri: ["'self'"], connectSrc: ["'self'"],
      fontSrc: ["'self'"], formAction: ["'self'"], frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'], objectSrc: ["'none'"],
      scriptSrc: ["'self'"], scriptSrcAttr: ["'none'"], styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  });
  router.get('/', docsCsp, (req, res) => {
    res.set('Cache-Control', 'no-store, max-age=0');
    res.render(path.join(root, 'views/api-docs.ejs'), {
      title: specification.info.title,
      csrfEnabled,
      csrfToken: res.locals.csrfToken || ''
    });
  });
  return router;
};
