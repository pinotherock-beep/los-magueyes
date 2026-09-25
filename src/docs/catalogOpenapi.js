const { version } = require('../../package.json');
const { components, documentationPaths, json } = require('./components');

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Los Magueyes · Microservicio de catálogo', version,
    description: 'Servicio opcional de solo lectura. Inicia con npm run catalog o Docker; CATALOG_PORT vale 4001 por defecto. Su URL y su /health son independientes del servidor web. No requiere autenticación, cookie ni CSRF. No incluye límites de solicitudes en su código. No se despliega dentro de la función de Netlify.'
  },
  servers: [{ url: '/', description: 'Origen actual del microservicio de catálogo.' }],
  tags: [
    { name: 'Estado', description: 'Disponibilidad del microservicio.' },
    { name: 'Catálogo', description: 'Productos disponibles en JSON.' },
    { name: 'Documentación', description: 'Swagger UI y contrato descargable.' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Estado'], operationId: 'getCatalogHealth', summary: 'Comprobar que el microservicio responde',
        description: 'No consulta MySQL.',
        responses: { 200: json('Servicio activo.', 'Health', { status: 'ok', service: 'catalog-service' }) }
      }
    },
    '/api/catalog': {
      get: {
        tags: ['Catálogo'], operationId: 'listCatalog', summary: 'Listar productos disponibles',
        description: 'Selecciona available=1 y ordena por sort_order de categoría y nombre del producto. Sin filtros ni paginación. Los precios se devuelven como cadenas decimales en MXN.',
        responses: {
          200: json('Catálogo disponible; products puede estar vacío.', 'ProductList', { products: [{ id: 1, name: 'Taco surtido', description: 'Barbacoa surtida de borrego.', price: '32.00', category: 'Tacos' }] }),
          500: json('Error al consultar el catálogo.', 'Message', { message: 'Error interno del catálogo.' })
        }
      }
    },
    ...structuredClone(documentationPaths)
  },
  components: { schemas: Object.fromEntries(['Health', 'Product', 'ProductList', 'Message'].map(name => [name, components.schemas[name]])) }
};
