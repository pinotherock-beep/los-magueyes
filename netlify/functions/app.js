const serverless = require('serverless-http');
let adapter;

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    if (!adapter) {
      process.env.NODE_ENV = 'production';
      process.env.NETLIFY = 'true';
      require('../../src/config/environment').validateProductionEnvironment();
      adapter = serverless(require('../../src/app'));
    }
    // Soporta la ruta pública y el acceso directo a la función.
    const prefix = '/.netlify/functions/app';
    const normalized = { ...event, headers: { ...event.headers } };
    const clientIp = normalized.headers['x-nf-client-connection-ip']
      || event.requestContext?.identity?.sourceIp || '127.0.0.1';
    normalized.requestContext = { ...event.requestContext, identity: { ...event.requestContext?.identity, sourceIp: clientIp } };
    if (normalized.headers['x-nf-client-connection-ip']) normalized.headers['x-forwarded-for'] = clientIp;
    if (normalized.path === prefix || normalized.path?.startsWith(prefix + '/')) {
      normalized.path = normalized.path.slice(prefix.length) || '/';
    }
    return await adapter(normalized, context);
  } catch (error) {
    console.error('No se pudo ejecutar Los Magueyes:', error.message);
    return { statusCode: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }, body: 'Servicio temporalmente no disponible. Revisa la configuración del servidor.' };
  }
};
