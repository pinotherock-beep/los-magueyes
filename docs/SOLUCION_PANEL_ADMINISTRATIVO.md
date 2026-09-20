# Panel administrativo local

La configuración actual se explica en [INICIAR_LOCAL.md](../INICIAR_LOCAL.md).

Ejecuta npm install, npm run setup:local, npm run check:local y npm start. Abre http://127.0.0.1:3000/auth/login y usa ADMIN_EMAIL y ADMIN_PASSWORD de .env.local.

La preparación local crea la base y el administrador. No requiere .env.production. Se conserva la corrección de origen local y las protecciones de sesión, CSRF y permisos.
