process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'secreto-exclusivo-para-pruebas';

const request = require('supertest');
const app = require('../src/app');
afterAll(() => require('../src/config/database').sequelize.close());

describe('Aplicación Los Magueyes', () => {
  function csrfTokenFrom(html) {
    const match = html.match(/name="_csrf" value="([a-f0-9]+)"/);
    if (!match) throw new Error('No se encontró el token CSRF en el formulario.');
    return match[1];
  }

  test('GET /health confirma que el servicio está activo', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'los-magueyes-web' });
  });

  test('GET / presenta la página principal', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Los Magueyes');
    expect(response.text).toContain('Barbacoa con auténtico sabor');
  });

  test('POST /auth/login rechaza datos inválidos sin consultar la base', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/auth/login');
    const response = await agent.post('/auth/login').type('form').send({
      _csrf: csrfTokenFrom(loginPage.text),
      email: 'incorrecto',
      password: '123'
    });
    expect(response.status).toBe(422);
    expect(response.text).toContain('Escribe un correo válido');
  });

  test('POST sin token CSRF es rechazado', async () => {
    const response = await request(app).post('/auth/login').type('form').send({
      email: 'usuario@ejemplo.com',
      password: 'ContraseñaSegura123!'
    });
    expect(response.status).toBe(403);
    expect(response.text).toContain('sesión del formulario venció');
  });

  test('POST /api/orders exige la dirección del cliente', async () => {
    const agent = request.agent(app);
    const menuPage = await agent.get('/menu');
    const response = await agent.post('/api/orders')
      .set('X-CSRF-Token', csrfTokenFrom(menuPage.text))
      .send({
        customerName: 'Israel Arr',
        phone: '999 123 4567',
        orderType: 'llevar',
        items: [{ productId: 1, quantity: 1 }]
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Revisa los datos del pedido.');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'address' })
    ]));
  });

  test('Helmet agrega una política de seguridad de contenido', async () => {
    const response = await request(app).get('/');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  test('GET /admin redirige a usuarios no autenticados', async () => {
    const response = await request(app).get('/admin');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('una ruta inexistente responde 404', async () => {
    const response = await request(app).get('/ruta-que-no-existe');
    expect(response.status).toBe(404);
  });
});
