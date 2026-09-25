process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'secreto-exclusivo-para-pruebas';

jest.mock('../src/config/database', () => ({
  sequelize: { query: jest.fn(), transaction: jest.fn(callback => callback({})) }
}));

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const SwaggerParser = require('@apidevtools/swagger-parser');
const { sequelize } = require('../src/config/database');
const app = require('../src/app');
const catalog = require('../microservices/catalog-service/server');
const webSpec = require('../src/docs/openapi');
const catalogSpec = require('../src/docs/catalogOpenapi');
const tokenFrom = html => html.match(/name="csrf-token" content="([a-f0-9]+)"/)[1];

beforeEach(() => sequelize.query.mockReset());

test.each([['web', webSpec], ['catálogo', catalogSpec]])('el contrato %s es OpenAPI válido y sus operationId son únicos', async (name, spec) => {
  await SwaggerParser.validate(structuredClone(spec));
  const operations = Object.values(spec.paths).flatMap(methods => Object.values(methods));
  const ids = operations.map(operation => operation.operationId);
  expect(new Set(ids).size).toBe(ids.length);
  for (const operation of operations) {
    expect(operation.summary).toBeTruthy();
    expect(operation.tags).toHaveLength(1);
  }
});

function routeOperations(router, prefix = '') {
  return router.stack.filter(layer => layer.route).flatMap(({ route }) => {
    const routePath = `${prefix}${route.path === '/' && prefix ? '' : route.path}`.replace(/:([A-Za-z_]+)/g, '{$1}');
    return Object.keys(route.methods).map(method => `${method.toUpperCase()} ${routePath}`);
  });
}

test('documenta exactamente todas las operaciones de negocio registradas en Express', () => {
  const expected = [
    ...routeOperations(app.router),
    ...routeOperations(require('../src/routes/publicRoutes')),
    ...routeOperations(require('../src/routes/authRoutes'), '/auth'),
    ...routeOperations(require('../src/routes/adminRoutes'), '/admin'),
    ...routeOperations(require('../src/routes/apiRoutes'), '/api')
  ].sort();
  const documented = spec => Object.entries(spec.paths)
    .filter(([route]) => !route.startsWith('/api-docs'))
    .flatMap(([route, methods]) => Object.keys(methods).map(method => `${method.toUpperCase()} ${route}`)).sort();
  expect(documented(webSpec)).toEqual(expected);
  expect(documented(catalogSpec)).toEqual(routeOperations(catalog.router).sort());
});

test.each([['web', app, webSpec], ['catálogo', catalog, catalogSpec]])('sirve Swagger y recursos locales del %s con CSP compatible', async (name, service, spec) => {
  const page = await request(service).get('/api-docs/');
  expect(page.status).toBe(200);
  expect(page.text).toContain('id="swagger-ui"');
  expect(page.headers['cache-control']).toContain('no-store');
  expect(page.headers['content-security-policy']).toContain("script-src 'self';");
  expect(page.headers['content-security-policy']).toContain("style-src 'self' 'unsafe-inline'");
  expect(page.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
  expect((await request(service).get('/api-docs')).status).toBe(200);
  const contract = await request(service).get('/api-docs/openapi.json');
  expect(contract.status).toBe(200);
  expect(contract.body).toEqual(spec);
  for (const file of ['swagger-ui.css', 'swagger-ui-bundle.js', 'initializer.js', 'docs.css']) {
    const asset = await request(service).get(`/api-docs/assets/${file}`);
    expect(asset.status).toBe(200);
    expect(asset.headers['content-type']).toMatch(file.endsWith('.js') ? /javascript/ : /css/);
  }
  expect(sequelize.query).not.toHaveBeenCalled();
});

test('el token de Swagger permite crear pedidos anónimos sin relajar CSRF ni CSP del sitio', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/api-docs/');
  expect(page.headers['set-cookie'][0]).toContain('HttpOnly');
  sequelize.query.mockResolvedValueOnce([{ id: 1, name: 'Taco', price: '32.00' }]).mockResolvedValueOnce([12]).mockResolvedValueOnce([1]);
  const order = structuredClone(webSpec.paths['/api/orders'].post.requestBody.content['application/json'].example);
  const result = await agent.post('/api/orders').set('X-CSRF-Token', tokenFrom(page.text)).send(order);
  expect(result.status).toBe(201);
  expect(result.body).toEqual(webSpec.paths['/api/orders'].post.responses[201].content['application/json'].example);
  expect((await agent.post('/api/orders').send(order)).status).toBe(403);
  expect((await agent.post('/api/orders').set('X-CSRF-Token', tokenFrom(page.text)).set('Origin', 'https://otro.example').send(order)).status).toBe(403);
  const home = await agent.get('/');
  expect(home.headers['content-security-policy']).toContain("style-src 'self' https://fonts.googleapis.com;");
});

test('Swagger obtiene un nuevo CSRF después de login y logout y respeta el rol admin', async () => {
  const agent = request.agent(app);
  const before = await agent.get('/api-docs/');
  sequelize.query.mockResolvedValueOnce([{ id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', password_hash: await bcrypt.hash('ClavePrueba123!', 4) }]);
  const login = await agent.post('/auth/login').set('X-CSRF-Token', tokenFrom(before.text)).send({ email: 'admin@example.com', password: 'ClavePrueba123!' });
  expect(login.status).toBe(302);
  const after = await agent.get('/api-docs/');
  expect(tokenFrom(after.text)).not.toBe(tokenFrom(before.text));
  expect((await agent.post('/admin/productos/1/eliminar').set('X-CSRF-Token', tokenFrom(before.text))).status).toBe(403);
  sequelize.query.mockResolvedValueOnce([]);
  expect((await agent.post('/admin/productos/1/eliminar').set('X-CSRF-Token', tokenFrom(after.text))).status).toBe(302);
  // El estado inválido se redirige con 302 en el controlador actual.
  const calls = sequelize.query.mock.calls.length;
  const invalidStatus = await agent.post('/admin/pedidos/1/estado').set('X-CSRF-Token', tokenFrom(after.text)).send({ status: 'inexistente' });
  expect(invalidStatus.status).toBe(302);
  expect(sequelize.query).toHaveBeenCalledTimes(calls);
  expect((await agent.post('/auth/logout').set('X-CSRF-Token', tokenFrom(after.text))).status).toBe(302);
  const loggedOut = await agent.get('/api-docs/');
  expect(tokenFrom(loggedOut.text)).not.toBe(tokenFrom(after.text));
  const denied = await agent.post('/admin/productos/1/eliminar').set('X-CSRF-Token', tokenFrom(loggedOut.text));
  expect(denied.headers.location).toBe('/auth/login');
});

test('el inicializador renueva CSRF solo al escribir al mismo origen y falla si no puede obtenerlo', async () => {
  let config;
  const fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => 'pagina' });
  const context = {
    window: { location: { origin: 'http://localhost:3000' } }, URL,
    document: { querySelector: () => ({ content: 'true' }) }, fetch,
    DOMParser: class { parseFromString() { return { querySelector: () => ({ content: 'token-actual' }) }; } },
    SwaggerUIBundle: options => { config = options; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/swagger-ui.js'), 'utf8'), context);
  const get = await config.requestInterceptor({ url: '/api/products', method: 'GET' });
  expect(get.credentials).toBe('same-origin');
  expect(fetch).not.toHaveBeenCalled();
  const post = await config.requestInterceptor({ url: '/api/orders', method: 'POST' });
  expect(post.headers['X-CSRF-Token']).toBe('token-actual');
  expect(fetch).toHaveBeenCalledTimes(1);
  const external = await config.requestInterceptor({ url: 'https://otro.example/api/orders', method: 'POST' });
  expect(external.headers).toBeUndefined();
  expect(fetch).toHaveBeenCalledTimes(1);
  fetch.mockResolvedValueOnce({ ok: false });
  await expect(config.requestInterceptor({ url: '/auth/login', method: 'POST' })).rejects.toThrow('CSRF');
});
