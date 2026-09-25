# API y rutas de Los Magueyes

La documentación interactiva usa Swagger UI y OpenAPI 3.0.3. Incluye las **18 operaciones de negocio del servidor web** y las **2 del microservicio de catálogo**, además de las rutas de documentación de cada servicio. Cada operación indica su método real, parámetros, cuerpo, validaciones, respuestas y requisitos de sesión.

## Abrir la documentación

Con MySQL y el proyecto configurados, ejecuta `npm start` y abre:

| Servicio | Swagger UI | Especificación descargable |
|---|---|---|
| Web (puerto 3000 por defecto) | http://127.0.0.1:3000/api-docs/ | http://127.0.0.1:3000/api-docs/openapi.json |
| Catálogo opcional (puerto 4001) | http://localhost:4001/api-docs/ | http://localhost:4001/api-docs/openapi.json |

El catálogo se inicia por separado con `npm run catalog`, usando las variables de conexión de su entorno o de `.env`, o mediante Docker. No es necesario para el servidor web y no se ejecuta dentro de Netlify. Para Netlify abre `https://tu-sitio.netlify.app/api-docs/`. Las solicitudes de Swagger usan el mismo origen donde se abrió la página, sin fijar localhost en producción.

Puedes descargar `openapi.json` e importarlo en Postman o Swagger Editor. Los archivos CSS y JavaScript de Swagger se sirven desde la aplicación, sin depender de un CDN ni enviar el contrato a un validador externo.

## Probar solicitudes

1. Abre `/api-docs/`, expande una sección y selecciona una operación.
2. Pulsa **Try it out**, completa los campos y pulsa **Execute**.
3. Para probar pedidos, consulta antes `GET /api/products` y usa un `productId` disponible en el ejemplo de `POST /api/orders`.
4. Para probar administración, abre **Iniciar sesión**, entra con tu administrador y regresa a Swagger en el mismo navegador y origen. También puedes ejecutar `POST /auth/login` en Swagger.

Los POST ejecutan cambios reales en la base del entorno abierto. El navegador envía su cookie y Swagger obtiene un token CSRF actualizado antes de cada POST, incluso después de iniciar o cerrar sesión. No hace falta pegar valores en **Authorize**. La cookie HttpOnly no se puede establecer manualmente desde Swagger.

La autenticación y el panel devuelven HTML y redirecciones. El navegador sigue los `302`, por lo que Swagger puede mostrar `200` y la página final. Para inspeccionar la redirección original usa un cliente HTTP con seguimiento de redirecciones desactivado.

## Inventario del servidor web

| Sección | Método | Ruta | Resultado |
|---|---|---|---|
| Estado | GET | `/health` | JSON con estado y nombre del servicio |
| Productos | GET | `/api/products` | JSON de productos disponibles |
| Pedidos | POST | `/api/orders` | JSON con folio, id y total del pedido |
| Autenticación | GET | `/auth/login` | Formulario HTML o redirección al panel |
| Autenticación | POST | `/auth/login` | Inicio de sesión y redirección |
| Autenticación | POST | `/auth/logout` | Cierre de sesión y redirección |
| Administración | GET | `/admin` | Resumen HTML del negocio |
| Administración · Productos | GET | `/admin/productos` | Lista HTML de todos los productos |
| Administración · Productos | GET | `/admin/productos/nuevo` | Formulario HTML y categorías |
| Administración · Productos | POST | `/admin/productos` | Alta y redirección |
| Administración · Productos | GET | `/admin/productos/{id}/editar` | Formulario HTML de edición |
| Administración · Productos | POST | `/admin/productos/{id}` | Actualización y redirección |
| Administración · Productos | POST | `/admin/productos/{id}/eliminar` | Desactivación y redirección |
| Administración · Pedidos | GET | `/admin/pedidos` | Cola e historial HTML |
| Administración · Pedidos | POST | `/admin/pedidos/{id}/estado` | Cambio de estado y redirección |
| Páginas públicas | GET | `/` | Inicio HTML |
| Páginas públicas | GET | `/menu` | Menú y carrito HTML |
| Páginas públicas | GET | `/nosotros` | Información HTML del restaurante |

El microservicio adicional ofrece `GET /health` y `GET /api/catalog`. En ambos servicios, `GET /api-docs/` abre la interfaz y `GET /api-docs/openapi.json` entrega el contrato. `/api-docs` sin barra final también funciona. Los archivos estáticos y HEAD/OPTIONS automáticos de Express no se enumeran como operaciones de negocio.

## Sesiones y seguridad

- Todos los POST del servidor web requieren **cookie `los_magueyes.sid` y CSRF de la misma sesión**, enviado mediante `X-CSRF-Token` o `_csrf` en el cuerpo.
- Para clientes externos a esta interfaz: visita `/menu`, `/auth/login` o `/api-docs/`, conserva las cookies y extrae el token del `<meta name="csrf-token">`. Tras iniciar sesión, vuelve a obtener el token porque se regenera la sesión. Los ejemplos cURL de Swagger no incluyen automáticamente la cookie HttpOnly: utiliza tu propio almacén de cookies.
- Crear pedidos admite sesión anónima. Las rutas `/admin` requieren sesión de usuario con rol `admin`; sin sesión redirigen a `/auth/login` y con otro rol responden `403`.
- Si se envía `Origin`, debe coincidir con el origen permitido: el host abierto en local o `APP_URL` en producción.
- La cookie es HttpOnly, SameSite=Lax, Secure en producción y tiene duración renovable de cuatro horas.
- La política CSP permite estilos en línea solo en la página de Swagger, que los necesita para renderizar. Los scripts y las conexiones permanecen limitados al mismo origen.

## Convenciones del contrato

- Precios y totales en MXN. `price` del catálogo es una cadena decimal (`"32.00"`); `total` de un pedido creado es un número (`64`).
- El servidor calcula los importes usando la base de datos. El pedido comienza en `pendiente` y se guarda junto con sus partidas en una transacción.
- Cada pedido admite de 1 a 30 productos distintos y de 1 a 20 unidades por producto. `address` es obligatorio también para consumo local.
- Los cuerpos tienen un límite de 25 KB. Se admiten JSON y formularios simples; el pedido con `items` anidados se documenta como JSON.
- Límite global: 300 solicitudes por IP cada 15 minutos, excepto `/health`. `/auth` limita a 20 (incluidas visitas GET); `/api/orders` a 30. Los errores de límite global/autenticación son HTML, y el límite específico de pedidos devuelve JSON.
- Editar y desactivar usan POST. Desactivar conserva el historial. Omitir `available` al crear o actualizar un producto lo guarda como desactivado.
- No existen respuestas 404 para ids positivos inexistentes en las acciones administrativas: se redirige. Las URL desconocidas sí responden 404 en HTML, incluso bajo `/api`.
- Un estado de pedido inválido actualmente redirige con `302`: `res.redirect()` sobrescribe el `422` asignado antes por el controlador. La documentación representa este comportamiento.

## Mantener la documentación

| Archivo | Contenido |
|---|---|
| `src/docs/openapi.js` | Operaciones, secciones y respuestas del servidor web |
| `src/docs/catalogOpenapi.js` | Contrato independiente del catálogo |
| `src/docs/components.js` | Esquemas, seguridad, parámetros y respuestas reutilizables |
| `src/routes/docsRoutes.js` | Rutas de Swagger y política CSP de la interfaz |
| `views/api-docs.ejs` | Página contenedora |
| `public/js/swagger-ui.js` | Configuración e integración de cookies/CSRF |
| `tests/swagger.test.js` | Validación de OpenAPI, cobertura de rutas e integración |

Al modificar una ruta, actualiza su contrato y ejecuta:

```bash
npm test -- --runTestsByPath tests/swagger.test.js tests/netlify.test.js
npm run build
```

Las pruebas validan ambos documentos con Swagger Parser y comparan las operaciones de negocio documentadas contra los routers de Express. Las pruebas de integración usan MySQL simulado y verifican la sesión, CSRF, recursos de Swagger y el adaptador de Netlify. `npm run test:all` ejecuta la suite completa.

Referencia de la herramienta: [configuración oficial de Swagger UI](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).
