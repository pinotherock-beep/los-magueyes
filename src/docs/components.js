const schema = name => ({ $ref: `#/components/schemas/${name}` });
const response = name => ({ $ref: `#/components/responses/${name}` });
const html = description => ({ description, content: { 'text/html': { schema: { type: 'string' } } } });
const json = (description, model, example) => ({
  description,
  content: { 'application/json': { schema: schema(model), ...(example && { example }) } }
});
const redirect = (description, location) => ({
  ...html(description),
  headers: { Location: { description: 'Destino de la redirección.', schema: { type: 'string', example: location } } }
});
const csrfField = {
  type: 'string',
  description: 'Token CSRF de la misma sesión. Opcional si se envía X-CSRF-Token; Swagger UI lo agrega automáticamente al encabezado.'
};
const body = (model, description) => ({
  required: true,
  description,
  content: {
    'application/x-www-form-urlencoded': { schema: schema(model) },
    'application/json': { schema: schema(model) }
  }
});
const csrfSecurity = [{ sessionCookie: [], csrfToken: [] }];
const sessionSecurity = [{ sessionCookie: [] }];
const idParameter = { $ref: '#/components/parameters/id' };

const schemas = {
  Health: {
    type: 'object', required: ['status', 'service'],
    properties: { status: { type: 'string', enum: ['ok'] }, service: { type: 'string' } }
  },
  Product: {
    type: 'object', required: ['id', 'name', 'description', 'price', 'category'],
    properties: {
      id: { type: 'integer', minimum: 1, example: 1 },
      name: { type: 'string', example: 'Taco surtido' },
      description: { type: 'string', nullable: true, example: 'Barbacoa surtida de borrego.' },
      price: { type: 'string', pattern: '^\\d+\\.\\d{2}$', example: '32.00', description: 'Precio en MXN. MySQL devuelve DECIMAL como cadena.' },
      category: { type: 'string', example: 'Tacos' }
    }
  },
  ProductList: {
    type: 'object', required: ['products'],
    properties: { products: { type: 'array', items: schema('Product') } }
  },
  OrderItemInput: {
    type: 'object', required: ['productId', 'quantity'],
    properties: {
      productId: { type: 'integer', minimum: 1, example: 1 },
      quantity: { type: 'integer', minimum: 1, maximum: 20, example: 2 }
    }
  },
  OrderInput: {
    type: 'object', required: ['customerName', 'address', 'phone', 'orderType', 'items'],
    properties: {
      customerName: { type: 'string', minLength: 2, maxLength: 100, example: 'Ana López' },
      address: { type: 'string', minLength: 5, maxLength: 250, example: 'Calle 10 #25, colonia Centro' },
      phone: { type: 'string', pattern: '^[0-9+()\\-\\s]{8,20}$', example: '9991234567' },
      orderType: { type: 'string', enum: ['local', 'llevar'], example: 'llevar' },
      notes: { type: 'string', maxLength: 300, example: 'Sin cebolla' },
      items: {
        type: 'array', minItems: 1, maxItems: 30, items: schema('OrderItemInput'),
        description: 'Cada productId debe aparecer una sola vez; utiliza quantity para pedir varias unidades.'
      },
      _csrf: csrfField
    }
  },
  OrderCreated: {
    type: 'object', required: ['message', 'orderId', 'orderNumber', 'total'],
    properties: {
      message: { type: 'string', example: 'Pedido recibido correctamente.' },
      orderId: { type: 'integer', minimum: 1, example: 12 },
      orderNumber: { type: 'string', pattern: '^[0-9]{4,}$', example: '0012', description: 'Identificador rellenado con ceros hasta un mínimo de cuatro dígitos.' },
      total: { type: 'number', minimum: 0, example: 64, description: 'Total en MXN calculado con los precios vigentes del servidor.' }
    }
  },
  Message: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } },
  ValidationError: {
    type: 'object', required: ['type', 'msg', 'path', 'location'],
    properties: {
      type: { type: 'string', example: 'field' },
      value: { description: 'Valor rechazado; su tipo depende del campo y puede omitirse.' },
      msg: { type: 'string', example: 'Invalid value' },
      path: { type: 'string', example: 'items[0].quantity' },
      location: { type: 'string', example: 'body' }
    }
  },
  OrderValidation: {
    type: 'object', required: ['message', 'errors'],
    properties: {
      message: { type: 'string', example: 'Revisa los datos del pedido.' },
      errors: { type: 'array', items: schema('ValidationError') }
    }
  },
  LoginInput: {
    type: 'object', required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'admin@example.com', description: 'Se eliminan espacios en los extremos y se convierte a minúsculas.' },
      password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, writeOnly: true, description: 'Contraseña del administrador configurada para este entorno.' },
      _csrf: csrfField
    }
  },
  CsrfInput: { type: 'object', properties: { _csrf: csrfField } },
  ProductInput: {
    type: 'object', required: ['category_id', 'name', 'price'],
    properties: {
      category_id: { type: 'integer', minimum: 1, example: 1, description: 'Categoría existente. Los formularios de alta/edición muestran las categorías disponibles.' },
      name: { type: 'string', minLength: 2, maxLength: 120, example: 'Taco especial' },
      description: { type: 'string', maxLength: 500, example: 'Barbacoa con salsa de la casa.' },
      price: { type: 'number', minimum: 0, maximum: 99999, example: 39.5 },
      available: { type: 'boolean', default: false, example: true, description: 'Si se omite se guarda como no disponible, también al actualizar.' },
      _csrf: csrfField
    }
  },
  OrderStatusInput: {
    type: 'object', required: ['status'],
    properties: {
      status: { type: 'string', enum: ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'], example: 'preparando' },
      _csrf: csrfField
    }
  }
};

const responses = {
  HtmlError: html('Error interno del servidor. Se devuelve una página HTML con un mensaje genérico.'),
  JsonError: json('Error interno del servidor.', 'Message', { message: 'Ocurrió un error inesperado.' }),
  HtmlForbidden: html('Token CSRF ausente/vencido, origen no permitido o usuario sin rol admin.'),
  JsonForbidden: json('Token CSRF ausente/vencido o encabezado Origin distinto al origen de la aplicación.', 'Message', { message: 'La sesión del formulario venció. Recarga la página e inténtalo de nuevo.' }),
  InvalidId: html('El identificador no es un entero positivo. Texto: Identificador inválido.'),
  GlobalRateLimit: {
    description: 'Más de 300 solicitudes por IP en 15 minutos (excepto /health). En /auth también se aplica un máximo de 20 solicitudes, incluidos GET, en 15 minutos.',
    headers: { 'Retry-After': { description: 'Segundos hasta poder reintentar.', schema: { type: 'integer' } } },
    content: { 'text/html': { schema: { type: 'string' }, example: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' } }
  },
  OrderRateLimit: {
    description: 'Más de 30 solicitudes a /api/orders por IP en 15 minutos (JSON), o límite global de 300 solicitudes (HTML).',
    headers: { 'Retry-After': { schema: { type: 'integer' }, description: 'Segundos hasta poder reintentar.' } },
    content: {
      'application/json': { schema: schema('Message'), example: { message: 'Se alcanzó el límite temporal de pedidos. Intenta nuevamente en unos minutos.' } },
      'text/html': { schema: { type: 'string' }, example: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' }
    }
  }
};

const components = {
  schemas, responses,
  parameters: {
    id: { name: 'id', in: 'path', required: true, description: 'Identificador entero positivo.', schema: { type: 'integer', minimum: 1 }, example: 1 }
  },
  securitySchemes: {
    sessionCookie: {
      type: 'apiKey', in: 'cookie', name: 'los_magueyes.sid',
      description: 'Cookie HttpOnly administrada por el navegador; no se pega en Authorize. Para /admin inicia sesión con rol admin en /auth/login desde este mismo origen. Para pedidos basta una sesión anónima creada al abrir /menu o /api-docs/.'
    },
    csrfToken: {
      type: 'apiKey', in: 'header', name: 'X-CSRF-Token',
      description: 'Requerido en todos los POST junto con la cookie de la misma sesión. Alternativa: campo _csrf del cuerpo. Swagger UI obtiene un token actualizado antes de cada POST. Fuera de Swagger, extráelo del meta csrf-token de /menu, /auth/login o /api-docs/.'
    }
  }
};

const documentationPaths = {
  '/api-docs/': {
    get: {
      tags: ['Documentación'], operationId: 'showApiDocs', summary: 'Abrir Swagger UI',
      description: 'También acepta /api-docs sin barra final. Interfaz interactiva alojada en el mismo servicio; los recursos estáticos no son operaciones de negocio.',
      responses: { 200: html('Interfaz de documentación Swagger UI.') }
    }
  },
  '/api-docs/openapi.json': {
    get: {
      tags: ['Documentación'], operationId: 'getOpenApiDocument', summary: 'Descargar la especificación OpenAPI',
      responses: { 200: { description: 'Contrato OpenAPI 3.0.3 importable en Postman o Swagger Editor.', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } } }
    }
  }
};

module.exports = { components, documentationPaths, schema, response, html, json, redirect, body, csrfSecurity, sessionSecurity, idParameter };
