const { sessionSecret, validateProductionEnvironment } = require('../src/config/environment');

describe('Configuración segura de producción', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  test('rechaza una clave de sesión insegura en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'cambia-esta-clave';
    expect(sessionSecret).toThrow('SESSION_SECRET');
  });

  test('acepta una configuración completa con HTTPS', () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      APP_URL: 'https://www.losmagueyes.example',
      DB_HOST: 'mysql',
      DB_NAME: 'los_magueyes',
      DB_USER: 'los_magueyes_app',
      DB_PASSWORD: 'una-clave-de-base-de-datos',
      SESSION_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef'
    });
    expect(validateProductionEnvironment()).toBeUndefined();
  });
});
