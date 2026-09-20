process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'secreto-exclusivo-para-pruebas';
process.env.APP_URL = 'http://localhost:3000';
const { test, beforeEach, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
sequelize.query = mock.fn();
const app = require('../src/app');
after(() => sequelize.close());
const token = html => html.match(/name="_csrf" value="([a-f0-9]+)"/)[1];

beforeEach(() => { sequelize.query.mock.resetCalls(); sequelize.query.mock.mockImplementation(async () => []); });

test('permite iniciar sesión desde el mismo host local y abrir el panel, luego cerrar sesión', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/auth/login');
  sequelize.query.mock.mockImplementationOnce(async () => ([{ id: 1, name: 'Administrador de prueba', email: 'admin@example.com', role: 'admin', password_hash: await bcrypt.hash('ClavePrueba123!', 4) }]));
  const login = await agent.post('/auth/login').set('Host', '127.0.0.1:3000').set('Origin', 'http://127.0.0.1:3000').type('form').send({ _csrf: token(page.text), email: 'admin@example.com', password: 'ClavePrueba123!' });
  assert.equal(login.status, 302);
  assert.equal(login.headers.location, '/admin');
  sequelize.query.mock.mockImplementationOnce(async () => ([{ products: 41, pending: 2, today_orders: 3, today_sales: '450.00' }]));
  const dashboard = await agent.get('/admin');
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.text.includes('Resumen del negocio'));
  assert.ok(dashboard.text.includes('$450.00'));
  const logout = await agent.post('/auth/logout').type('form').send({ _csrf: token(dashboard.text) });
  assert.equal(logout.status, 302);
  assert.equal((await agent.get('/admin')).headers.location, '/auth/login');
});

test('rechaza un origen externo incluso con token válido', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/auth/login');
  const result = await agent.post('/auth/login').set('Origin', 'https://otro.example').type('form').send({ _csrf: token(page.text), email: 'admin@example.com', password: 'ClavePrueba123!' });
  assert.equal(result.status, 403);
  assert.equal(sequelize.query.mock.callCount(), 0);
});

test('una contraseña incorrecta no da acceso al panel', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/auth/login');
  sequelize.query.mock.mockImplementationOnce(async () => ([]));
  const result = await agent.post('/auth/login').type('form').send({ _csrf: token(page.text), email: 'admin@example.com', password: 'ClaveIncorrecta123!' });
  assert.equal(result.status, 401);
  assert.equal((await agent.get('/admin')).headers.location, '/auth/login');
});

test('producción conserva APP_URL como único origen permitido', () => {
  const { sameOrigin } = require('../src/middleware/security');
  const previousEnv = process.env.NODE_ENV;
  const previousUrl = process.env.APP_URL;
  process.env.NODE_ENV = 'production';
  process.env.APP_URL = 'https://restaurante.example';
  try {
    for (const [origin, expectedStatus] of [['https://restaurante.example', undefined], ['http://127.0.0.1:3000', 403], ['null', 403]]) {
      let called = false;
      sameOrigin({ method: 'POST', protocol: 'http', get: key => key === 'origin' ? origin : '127.0.0.1:3000' }, {}, error => {
        called = true;
        assert.equal(error?.status, expectedStatus);
      });
      assert.ok(called);
    }
  } finally {
    process.env.NODE_ENV = previousEnv;
    process.env.APP_URL = previousUrl;
  }
});
