require('dotenv').config();

const { validateProductionEnvironment } = require('./src/config/environment');
validateProductionEnvironment();

const app = require('./src/app');
const { testConnection, sequelize } = require('./src/config/database');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
let server;

async function start() {
  try {
    await testConnection();
    if (app.locals.sessionStore) await app.locals.sessionStore.initialize();
    server = app.listen(PORT, HOST, () => {
      console.log(`Los Magueyes: http://${HOST}:${PORT}`);
      console.log(`Panel: http://${HOST}:${PORT}/auth/login`);
    });
    server.on('error', error => {
      console.error(error.code === 'EADDRINUSE' ? `El puerto ${PORT} está ocupado. Cierra la otra instancia o cambia PORT en .env.local.` : error.message);
      shutdown('Error de inicio');
    });
  } catch (error) {
    console.error('No fue posible iniciar la aplicación:', error.message);
    console.error('Verifica XAMPP/MySQL y ejecuta npm run setup:local. Para uso local revisa .env.local.');
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} recibido. Cerrando el servidor...`);
  if (server) await new Promise(resolve => server.close(resolve));
  await sequelize.close();
  process.exit(0);
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) start();

module.exports = { start };
