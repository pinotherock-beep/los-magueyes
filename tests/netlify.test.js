// Simula únicamente MySQL; Express, sesiones, cookies, EJS y adaptador son reales.
const mockSessions = new Map();
jest.mock('../src/config/database', () => ({
  sequelize: { query: jest.fn(), transaction: jest.fn(fn => fn({})) },
  pool: { execute: jest.fn(async (sql, args) => {
    if (sql.includes('SELECT data FROM sessions')) return [[mockSessions.has(args[0]) ? { data: mockSessions.get(args[0]) } : undefined].filter(Boolean)];
    if (sql.includes('INSERT INTO sessions')) mockSessions.set(args[0], args[2]);
    if (sql.includes('DELETE FROM sessions WHERE session_id')) mockSessions.delete(args[0]);
    return [[]];
  }) }
}));
const bcrypt = require('bcryptjs');
const { sequelize, pool } = require('../src/config/database');
Object.assign(process.env, {
  NODE_ENV: 'production', NETLIFY: 'true', APP_URL: 'https://magueyes.example',
  SESSION_SECRET: 'a'.repeat(64), DB_HOST: 'db.example', DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'test'
});
const { handler } = require('../netlify/functions/app');
let cookie = '';
const csrf = html => html.match(/name="csrf-token" content="([a-f0-9]+)"/)[1];
async function call(path, method = 'GET', body, extra = {}) {
  const response = await handler({ path, httpMethod: method, headers: {
    host: 'magueyes.example', 'x-forwarded-proto': 'https', 'x-forwarded-for': '203.0.113.10',
    cookie, 'content-type': 'application/json', origin: 'https://magueyes.example', ...extra
  }, body: body == null ? null : (typeof body === 'string' ? body : JSON.stringify(body)), requestContext: { identity: { sourceIp: '127.0.0.1' } } }, {});
  const set = response.multiValueHeaders?.['set-cookie'] || (response.headers?.['set-cookie'] ? [response.headers['set-cookie']] : []);
  if (set.length) cookie = set[0].split(';')[0];
  return response;
}
beforeEach(() => { cookie = ''; mockSessions.clear(); sequelize.query.mockReset(); });

test('función sirve EJS, HTTPS, cookie persistente y acceso administrativo con sesión regenerada', async () => {
  const login = await call('/.netlify/functions/app/auth/login');
  expect(login.statusCode).toBe(200);
  expect(login.multiValueHeaders['set-cookie'][0]).toContain('Secure');
  expect(login.multiValueHeaders['set-cookie'][0]).toContain('HttpOnly');
  expect(login.headers['cache-control']).toContain('no-store');
  expect(login.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  const oldCookie = cookie;
  sequelize.query.mockResolvedValueOnce([{ id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', password_hash: await bcrypt.hash('Seguro123456!', 4) }]);
  const auth = await call('/auth/login', 'POST', new URLSearchParams({ _csrf: csrf(login.body), email: 'admin@example.com', password: 'Seguro123456!' }).toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  expect(auth.statusCode).toBe(302);
  expect(cookie).not.toBe(oldCookie);
  sequelize.query.mockResolvedValueOnce([{ products: 41, pending: 1, today_orders: 1, today_sales: '64.00' }]);
  const dashboard = await call('/admin');
  expect(dashboard.statusCode).toBe(200);
  expect(dashboard.body).toContain('$64.00');
  expect((await call('/auth/logout', 'POST', { _csrf: csrf(dashboard.body) })).statusCode).toBe(302);
  expect((await call('/admin')).headers.location).toBe('/auth/login');
});

test('registra pedido con precio del servidor y conserva nombre sin doble escape', async () => {
  const menu = await call('/menu');
  sequelize.query.mockResolvedValueOnce([{ id: 1, name: 'Taco', price: '32.10' }]).mockResolvedValueOnce([42]).mockResolvedValueOnce([1]);
  const result = await call('/api/orders', 'POST', {
    customerName: "Ana O'Connor & familia", address: 'Calle 10 #20', phone: '9991234567', orderType: 'llevar',
    items: [{ productId: 1, quantity: 3, price: 0 }]
  }, { 'x-csrf-token': csrf(menu.body) });
  expect(result.statusCode).toBe(201);
  expect(JSON.parse(result.body)).toMatchObject({ orderNumber: '0042', total: 96.3 });
  expect(sequelize.query.mock.calls[1][1].replacements.customerName).toBe("Ana O'Connor & familia");
});

test.each([
  [], [{ productId: 1, quantity: 21 }], [{ productId: 1, quantity: 0 }],
  [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }], [null]
].map(items => [items]))('rechaza carrito inválido %j', async (items) => {
  const menu = await call('/menu');
  const result = await call('/api/orders', 'POST', { customerName: 'Ana', address: 'Calle 10', phone: '9991234567', orderType: 'llevar', items }, { 'x-csrf-token': csrf(menu.body) });
  expect(result.statusCode).toBe(422);
  expect(sequelize.query).not.toHaveBeenCalled();
});

test('rechaza otro origen con CSRF válido', async () => {
  const menu = await call('/menu');
  expect((await call('/api/orders', 'POST', {}, { 'x-csrf-token': csrf(menu.body), origin: 'https://otro.example' })).statusCode).toBe(403);
});

test('un fallo al recuperar la sesión muestra error controlado sin romper EJS', async () => {
  await call('/menu');
  pool.execute.mockRejectedValueOnce(new Error('DB no disponible'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const result = await call('/admin');
  log.mockRestore();
  expect(result.statusCode).toBe(500);
  expect(result.body).toContain('Ocurrió un error inesperado');
  expect(result.body).not.toContain('ReferenceError');
});

test('administrador crea, edita y desactiva productos y cambia estado de pedidos', async () => {
  const login = await call('/auth/login');
  sequelize.query.mockResolvedValueOnce([{ id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', password_hash: await bcrypt.hash('Seguro123456!', 4) }]);
  await call('/auth/login', 'POST', { _csrf: csrf(login.body), email: 'admin@example.com', password: 'Seguro123456!' });
  sequelize.query.mockResolvedValueOnce([{ id: 1, name: 'Tacos' }]);
  const page = await call('/admin/productos/nuevo');
  expect(page.statusCode).toBe(200);
  const token = csrf(page.body);
  sequelize.query.mockResolvedValueOnce([50]);
  expect((await call('/admin/productos', 'POST', { _csrf: token, category_id: 1, name: "Taco & salsa", description: 'Prueba', price: 0, available: true })).statusCode).toBe(302);
  expect(sequelize.query.mock.calls.at(-1)[1].replacements.name).toBe('Taco & salsa');
  sequelize.query.mockResolvedValueOnce([{ id: 50, name: 'Taco & salsa', description: 'Prueba', category_id: 1, price: 0, available: 1 }]).mockResolvedValueOnce([{ id: 1, name: 'Tacos' }]);
  const edit = await call('/admin/productos/50/editar');
  expect(edit.statusCode).toBe(200);
  expect(edit.body).toContain('Taco &amp; salsa');
  expect(edit.body).toContain('name="price" value="0"');
  sequelize.query.mockResolvedValueOnce([]);
  expect((await call('/admin/productos/50', 'POST', { _csrf: token, category_id: 1, name: 'Taco especial', price: 39.5 })).statusCode).toBe(302);
  expect(sequelize.query.mock.calls.at(-1)[1].replacements.available).toBe(0);
  sequelize.query.mockResolvedValueOnce([]);
  expect((await call('/admin/productos/50/eliminar', 'POST', { _csrf: token })).statusCode).toBe(302);
  expect(sequelize.query.mock.calls.at(-1)[0]).toContain('available = 0');
  sequelize.query.mockResolvedValueOnce([]);
  expect((await call('/admin/pedidos/42/estado', 'POST', { _csrf: token, status: 'listo' })).statusCode).toBe(302);
  expect(sequelize.query.mock.calls.at(-1)[1].replacements).toEqual({ id: 42, status: 'listo' });
  const count = sequelize.query.mock.calls.length;
  expect((await call('/admin/productos/invalido/eliminar', 'POST', { _csrf: token })).statusCode).toBe(400);
  expect(sequelize.query.mock.calls).toHaveLength(count);
});
