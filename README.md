# Los Magueyes — Node.js, MySQL y Netlify

Menú y carrito, pedidos con nombre/dirección/teléfono, folios y cola de llegada, acceso administrativo, productos y estados de pedidos. HTML EJS, CSS y JavaScript separados. El diseño y catálogo originales se conservan.

## Empezar en Visual Studio Code

Necesitas Node.js 22 y MySQL 8 o MariaDB de XAMPP.

```bash
npm ci
npm run setup:local
npm run check:local
npm start
```

Inicia MySQL antes. El primer comando de configuración crea `.env.local` y una contraseña aleatoria. Si la conexión falla, ajusta `DB_USER`, `DB_PASSWORD` y `DB_PORT` en ese archivo y repite `setup:local`.

Abre http://127.0.0.1:3000. Acceso administrativo: http://127.0.0.1:3000/auth/login. Usa `ADMIN_EMAIL` y `ADMIN_PASSWORD` de `.env.local`. No uses Live Server para abrir EJS.

## GitHub y Netlify

Lee **[SUBIR_GITHUB_NETLIFY.md](SUBIR_GITHUB_NETLIFY.md)**, con instrucciones completas.

- GitHub aloja el código; GitHub Pages no ejecuta este backend.
- Netlify ejecuta Express mediante `netlify/functions/app.js`, definido en `netlify.toml`.
- La base MySQL debe estar alojada y accesible desde Netlify. Tu MySQL de XAMPP no se publica al subir el código.
- Compilación: `npm run build`. Directorio público: `public`. Funciones: `netlify/functions`.
- Configura las variables del ejemplo de producción en Netlify y prepara la base antes de utilizar pedidos o acceso administrativo.
- No se incluyen credenciales, historial `.git` ni `node_modules` en la entrega. Las habilidades `.codex/skills` originales se conservan sin cambios.

## Documentación de API con Swagger

Con el servidor iniciado, abre **http://127.0.0.1:3000/api-docs/**. Incluye todas las rutas del servidor, organizadas por productos, pedidos, autenticación, administración y páginas públicas, con parámetros, ejemplos y respuestas.

La especificación descargable está en `/api-docs/openapi.json`. Para el microservicio opcional de catálogo, abre `http://localhost:4001/api-docs/` después de iniciarlo con `npm run catalog`. En Netlify usa `/api-docs/` en el dominio del sitio.

Swagger gestiona la cookie de sesión y el token CSRF al probar solicitudes. Para administrar, inicia sesión en otra pestaña del mismo sitio. **Los POST guardan cambios reales.** Consulta la guía e inventario completo en **[docs/API_SWAGGER.md](docs/API_SWAGGER.md)**.

## Verificación

```bash
npm run test:all
npm run build
```

Las pruebas automatizadas usan respuestas simuladas de MySQL; verifican rutas, acceso, cookies HTTPS, CSRF, pedidos y el adaptador de Netlify. `npm run check:local` comprueba tu base local real. Lee `REVISION.md` para resultados y límites de la revisión.

## Comandos

| Comando | Uso |
|---|---|
| `npm start` | Servidor local, puerto 3000 |
| `npm run dev` | Reinicio al modificar código |
| `npm run setup:local` | Tablas, catálogo inicial y administrador local |
| `npm run check:local` | Comprobar MySQL y administrador local |
| `npm run setup:production` | Preparar base remota usando `.env.production` |
| `npm run start:production` | Servidor Node tradicional, fuera de Netlify |
| `npm run test:all` | Todas las pruebas automatizadas |
| `npm run build` | Verificar JavaScript y plantillas para Netlify |

## Funcionamiento

El total del pedido se calcula con los precios de la base, no con valores enviados por el navegador. El carrito permite hasta 30 productos distintos y 20 unidades por producto. Desactivar un producto conserva el historial. Los pedidos activos aparecen en orden de llegada; el administrador puede cambiar estados manualmente. El folio autoincremental puede tener saltos si una transacción falla. No incluye pago en línea: se paga en el establecimiento.

## Docker opcional

Copia `.env.example` a `.env` y completa todas las contraseñas. Ejecuta `docker compose up --build -d` y `docker compose exec web node scripts/seed-admin.js`. Abre http://localhost:3000. El servicio adicional de catálogo está en el puerto 4001; no es necesario para Netlify, que usa `/api/products` del backend principal.

Los archivos `deploy/` y `docs/DESPLIEGUE_DOMINIO.md` corresponden a alojamiento tradicional con Docker, no al flujo de Netlify.
