try {
  require('../src/config/local').loadLocalEnvironment();
  require('../server').start();
} catch (error) {
  console.error('No se pudo iniciar el entorno local:', error.message);
  process.exitCode = 1;
}
