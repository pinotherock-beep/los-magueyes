const { version } = require('../../package.json');
const { components, documentationPaths, schema, response, html, json, redirect, body, csrfSecurity, sessionSecurity, idParameter } = require('./components');

const publicPage = (operationId, summary, description) => ({
  tags: ['Páginas públicas'], operationId, summary, description,
  responses: { 200: html('Página HTML renderizada con EJS.') }
});
const adminPage = (operationId, summary, description) => ({
  tags: ['Administración'], operationId, summary, description, security: sessionSecurity,
  responses: {
    200: html('Página HTML del panel administrativo.'),
    302: redirect('Sin sesión: redirige al formulario de acceso.', '/auth/login'),
    403: response('HtmlForbidden')
  }
});
const adminWrite = (operationId, summary, description, destination) => ({
  tags: ['Administración'], operationId, summary, description, security: csrfSecurity,
  responses: {
    302: redirect(`Operación terminada: redirige a ${destination}. Sin sesión, redirige a /auth/login después de validar CSRF.`, destination),
    403: response('HtmlForbidden')
  }
});

const paths = {
  '/health': {
    get: {
      tags: ['Estado'], operationId: 'getWebHealth', summary: 'Comprobar que el servidor web responde',
      description: 'No consulta MySQL ni verifica sus tablas. Está exento del límite global de solicitudes.',
      responses: { 200: json('Servidor web activo.', 'Health', { status: 'ok', service: 'los-magueyes-web' }) }
    }
  },
  '/api/products': {
    get: {
      tags: ['Productos'], operationId: 'listAvailableProducts', summary: 'Listar productos disponibles',
      description: 'Devuelve productos con available=1 y el nombre de su categoría, ordenados por sort_order de categoría y nombre del producto. Sin paginación ni parámetros de consulta. price es una cadena decimal en MXN.',
      responses: { 200: json('Catálogo disponible; products puede ser un arreglo vacío.', 'ProductList', { products: [{ id: 1, name: 'Taco surtido', description: 'Barbacoa surtida de borrego.', price: '32.00', category: 'Tacos' }] }) }
    }
  },
  '/api/orders': {
    post: {
      tags: ['Pedidos'], operationId: 'createOrder', summary: 'Registrar un pedido', security: csrfSecurity,
      description: 'No requiere iniciar sesión como administrador. Requiere cookie de sesión y CSRF, obtenidos al abrir /menu o /api-docs/. Registra el pedido en estado pendiente y sus partidas en una transacción. El servidor consulta precios y calcula el total; no acepta precios ni totales del cliente como fuente del cálculo. Máximo 30 productos distintos y 20 unidades de cada uno. No procesa pagos.',
      requestBody: {
        required: true,
        description: 'Datos del cliente y productos; address también es obligatorio para orderType=local.',
        content: { 'application/json': {
          schema: schema('OrderInput'),
          example: { customerName: 'Ana López', address: 'Calle 10 #25, colonia Centro', phone: '9991234567', orderType: 'llevar', notes: 'Sin cebolla', items: [{ productId: 1, quantity: 2 }] }
        } }
      },
      responses: {
        201: json('Pedido guardado. El ejemplo supone un precio vigente de $32.00.', 'OrderCreated', { message: 'Pedido recibido correctamente.', orderId: 12, orderNumber: '0012', total: 64 }),
        403: response('JsonForbidden'),
        422: {
          description: 'Datos inválidos (incluye errors), producto inexistente/no disponible, o referencia eliminada durante la operación (solo message).',
          content: { 'application/json': {
            schema: { oneOf: [schema('OrderValidation'), { type: 'object', required: ['message'], properties: { message: { type: 'string' } }, additionalProperties: false }] },
            examples: {
              validation: { summary: 'Cantidad fuera de rango', value: { message: 'Revisa los datos del pedido.', errors: [{ type: 'field', value: 21, msg: 'Invalid value', path: 'items[0].quantity', location: 'body' }] } },
              unavailable: { summary: 'Producto no disponible', value: { message: 'Uno de los productos ya no está disponible.' } },
              reference: { summary: 'Referencia eliminada', value: { message: 'La categoría o el producto seleccionado ya no existe.' } }
            }
          } }
        },
        429: response('OrderRateLimit')
      }
    }
  },
  '/auth/login': {
    get: {
      tags: ['Autenticación'], operationId: 'showLogin', summary: 'Mostrar el formulario de acceso',
      description: 'Crea la sesión anónima y el token CSRF. El token está en el meta csrf-token y en el campo oculto _csrf.',
      responses: { 200: html('Formulario de acceso.'), 302: redirect('El usuario ya tiene sesión.', '/admin') }
    },
    post: {
      tags: ['Autenticación'], operationId: 'login', summary: 'Iniciar sesión', security: csrfSecurity,
      description: 'Valida correo, contraseña y usuario activo. Regenera la sesión al entrar: la cookie cambia y el token CSRF anterior deja de ser válido. La cookie dura 4 horas y se renueva con actividad; es HttpOnly, SameSite=Lax y Secure en producción. No devuelve JWT. El panel requiere rol admin.',
      requestBody: body('LoginInput', 'Credenciales y CSRF por encabezado o campo _csrf.'),
      responses: {
        302: redirect('Sesión iniciada. Set-Cookie contiene la nueva cookie de sesión.', '/admin'),
        401: html('Formulario HTML con el mensaje Correo o contraseña incorrectos.'),
        403: response('HtmlForbidden'),
        422: html('Formulario HTML con los errores de validación del correo o contraseña.')
      }
    }
  },
  '/auth/logout': {
    post: {
      tags: ['Autenticación'], operationId: 'logout', summary: 'Cerrar sesión', security: csrfSecurity,
      description: 'Destruye la sesión actual y elimina la cookie. Admite una sesión anónima con CSRF válido.',
      requestBody: { ...body('CsrfInput', 'Puede omitirse el cuerpo si se envía X-CSRF-Token.'), required: false },
      responses: { 302: redirect('Sesión destruida.', '/'), 403: response('HtmlForbidden') }
    }
  },
  '/admin': {
    get: adminPage('showDashboard', 'Mostrar el resumen administrativo', 'Muestra cantidad de productos, pedidos pendientes, pedidos de hoy y ventas del día excluyendo cancelados.')
  },
  '/admin/productos': {
    get: { ...adminPage('showAdminProducts', 'Listar productos en el panel', 'Incluye productos disponibles y desactivados; ordena por categoría y nombre.'), tags: ['Administración · Productos'] },
    post: {
      ...adminWrite('createProduct', 'Crear un producto', 'El nombre debe ser único dentro de la categoría. Si se omite available, el producto queda desactivado.', '/admin/productos'),
      tags: ['Administración · Productos'], requestBody: body('ProductInput', 'Datos completos del nuevo producto.')
    }
  },
  '/admin/productos/nuevo': {
    get: { ...adminPage('showNewProductForm', 'Mostrar el formulario de alta', 'Incluye las categorías existentes y sus identificadores.'), tags: ['Administración · Productos'] }
  },
  '/admin/productos/{id}/editar': {
    get: {
      ...adminPage('showEditProductForm', 'Mostrar el formulario de edición', 'Si el producto no existe, redirige a /admin/productos. No devuelve 404.'),
      tags: ['Administración · Productos'], parameters: [idParameter],
      responses: {
        200: html('Formulario HTML con producto y categorías.'),
        302: redirect('Producto inexistente: /admin/productos. Sin sesión: /auth/login.', '/admin/productos'),
        400: response('InvalidId'), 403: response('HtmlForbidden')
      }
    }
  },
  '/admin/productos/{id}': {
    post: {
      ...adminWrite('updateProduct', 'Actualizar un producto', 'Actualización completa mediante POST. Si se omite available se guarda como desactivado. Un id válido inexistente también redirige; no hay respuesta 404.', '/admin/productos'),
      tags: ['Administración · Productos'], parameters: [idParameter],
      requestBody: body('ProductInput', 'Datos completos del producto, incluida su disponibilidad.')
    }
  },
  '/admin/productos/{id}/eliminar': {
    post: {
      ...adminWrite('deactivateProduct', 'Desactivar un producto', 'Establece available=0 sin borrar el producto ni sus pedidos históricos. Un id válido inexistente también redirige.', '/admin/productos'),
      tags: ['Administración · Productos'], parameters: [idParameter],
      requestBody: { ...body('CsrfInput', 'Puede omitirse el cuerpo si se envía X-CSRF-Token.'), required: false }
    }
  },
  '/admin/pedidos': {
    get: {
      ...adminPage('showAdminOrders', 'Mostrar la cola e historial de pedidos', 'Hasta 100 pedidos activos (pendiente, preparando, listo) ordenados por llegada e id. Hasta 50 finalizados (entregado, cancelado) ordenados por actualización e id descendentes.'),
      tags: ['Administración · Pedidos']
    }
  },
  '/admin/pedidos/{id}/estado': {
    post: {
      ...adminWrite('updateOrderStatus', 'Cambiar el estado de un pedido', 'Permite cualquiera de los cinco estados; no impone una secuencia de transiciones. Un id válido inexistente también redirige. Actualmente un estado inválido también termina en 302 hacia /admin/pedidos: Express res.redirect() sustituye el 422 asignado previamente.', '/admin/pedidos'),
      tags: ['Administración · Pedidos'], parameters: [idParameter],
      requestBody: body('OrderStatusInput', 'Nuevo estado del pedido.')
    }
  },
  '/': { get: publicPage('showHome', 'Mostrar la página de inicio', 'Página pública del restaurante.') },
  '/menu': { get: publicPage('showMenu', 'Mostrar el menú y carrito', 'Página de pedidos; crea una sesión anónima con token CSRF disponible en el meta csrf-token.') },
  '/nosotros': { get: publicPage('showAbout', 'Mostrar la página Nosotros', 'Información pública del restaurante.') },
  ...structuredClone(documentationPaths)
};

// Respuestas transversales que aplica Express a las operaciones del servidor web.
for (const [route, methods] of Object.entries(paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    const isApi = route.startsWith('/api/');
    operation.responses[500] = response(isApi ? 'JsonError' : 'HtmlError');
    if (route !== '/health' && !operation.responses[429]) operation.responses[429] = response('GlobalRateLimit');
    if (method === 'post') {
      operation.responses[400] = isApi ? json('JSON mal formado.', 'Message') : html('JSON mal formado o identificador inválido.');
      operation.responses[413] = isApi ? json('El cuerpo supera el límite de 25 KB.', 'Message') : html('El cuerpo supera el límite de 25 KB.');
      if (operation.parameters) operation.responses[400] = response('InvalidId');
    }
  }
}
for (const route of ['/admin/productos', '/admin/productos/{id}']) {
  paths[route].post.responses[409] = html('Ya existe un producto con ese nombre en la categoría.');
  paths[route].post.responses[422] = html('Formulario con errores de validación, o página de error si la categoría ya no existe.');
}

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Los Magueyes · API y rutas web', version,
    description: [
      'Documentación de todas las rutas explícitas del servidor Express. Las secciones Productos, Pedidos y Estado devuelven JSON; el panel, autenticación y páginas públicas devuelven HTML o redirecciones.',
      '### Probar desde Swagger UI',
      'Usa **Try it out** y después **Execute**. Las operaciones POST modifican los datos del entorno abierto. Esta interfaz conserva las cookies del navegador y obtiene automáticamente un token CSRF actualizado antes de cada POST. Para administrar, inicia sesión en [/auth/login](/auth/login) en otra pestaña del mismo origen y vuelve aquí. También puedes ejecutar POST /auth/login desde Swagger. El navegador sigue las redirecciones: puede mostrar el HTML final con 200 en lugar del 302 original.',
      '### Sesión y CSRF',
      'Todos los POST requieren una cookie de sesión y X-CSRF-Token (o _csrf en el cuerpo). Un pedido admite sesión anónima. Las rutas /admin requieren además un usuario con rol admin; sin sesión redirigen a /auth/login y con otro rol responden 403. Un encabezado Origin presente debe coincidir con el origen permitido. En producción se usa APP_URL.',
      '### Convenciones y límites',
      'Importes en MXN. Los precios del catálogo son cadenas DECIMAL; el total creado es numérico. Cuerpos JSON o formularios limitados a 25 KB. Límite global: 300 solicitudes/IP/15 min, excepto /health; /auth: 20 y /api/orders: 30. No hay filtros de consulta ni paginación de API. Las rutas inexistentes devuelven 404 en HTML, incluso bajo /api. Express también resuelve HEAD a partir de GET y OPTIONS de forma automática.',
      'El microservicio opcional tiene su propia documentación en su puerto: normalmente http://localhost:4001/api-docs/. No forma parte de la función de Netlify.'
    ].join('\n\n')
  },
  servers: [{ url: '/', description: 'Mismo origen donde se abrió la documentación (local, Docker o Netlify).' }],
  tags: [
    { name: 'Estado', description: 'Disponibilidad del servidor.' },
    { name: 'Productos', description: 'Consulta pública del catálogo en JSON.' },
    { name: 'Pedidos', description: 'Registro público de pedidos en JSON.' },
    { name: 'Autenticación', description: 'Sesiones con cookie y formularios HTML.' },
    { name: 'Administración', description: 'Resumen del negocio. Requiere rol admin.' },
    { name: 'Administración · Productos', description: 'Formularios y acciones del catálogo. Requiere rol admin.' },
    { name: 'Administración · Pedidos', description: 'Cola, historial y estados. Requiere rol admin.' },
    { name: 'Páginas públicas', description: 'Páginas HTML del sitio.' },
    { name: 'Documentación', description: 'Swagger UI y contrato descargable.' }
  ],
  paths, components
};
