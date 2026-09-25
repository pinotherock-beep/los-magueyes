/* global SwaggerUIBundle */
(() => {
  const csrfEnabled = document.querySelector('meta[name="docs-csrf-enabled"]').content === 'true';
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  window.ui = SwaggerUIBundle({
    url: '/api-docs/openapi.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    filter: true,
    docExpansion: 'list',
    operationsSorter: 'alpha',
    displayRequestDuration: true,
    defaultModelsExpandDepth: 1,
    validatorUrl: null,
    persistAuthorization: false,
    supportedSubmitMethods: ['get', 'post'],
    requestInterceptor: async request => {
      const target = new URL(request.url, window.location.origin);
      if (target.origin !== window.location.origin) return request;
      request.credentials = 'same-origin';
      if (csrfEnabled && !safeMethods.has((request.method || 'GET').toUpperCase())) {
        // El login regenera la sesión y logout la destruye. Obtener el token
        // justo antes de cada escritura mantiene vigente la pareja cookie/CSRF.
        const response = await fetch('/api-docs/', { credentials: 'same-origin', cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo actualizar la sesión CSRF. Recarga Swagger e inténtalo de nuevo.');
        const page = new DOMParser().parseFromString(await response.text(), 'text/html');
        const token = page.querySelector('meta[name="csrf-token"]')?.content;
        if (!token) throw new Error('No se encontró el token CSRF de la sesión.');
        request.headers = request.headers || {};
        request.headers['X-CSRF-Token'] = token;
      }
      return request;
    }
  });
})();
