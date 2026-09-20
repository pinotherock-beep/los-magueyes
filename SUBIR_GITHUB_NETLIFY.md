# Publicar Los Magueyes en GitHub y Netlify

## 1. Preparar los archivos

Descomprime el ZIP y abre en VS Code la carpeta que contiene `package.json` y `netlify.toml`. Instala Node.js 22. Ejecuta:

```bash
npm ci
npm run test:all
npm run build
```

Nunca subas `.env`, `.env.local`, `.env.production` ni `node_modules`. Ya están excluidos por `.gitignore`. Esta entrega parte de un historial nuevo para evitar publicar configuraciones antiguas. Si las credenciales del ZIP original ya fueron publicadas en otro repositorio, reemplázalas en el proveedor correspondiente.

## 2. Crear el repositorio

Crea un repositorio vacío en GitHub, sin README inicial. Desde la terminal de VS Code:

```bash
git init -b main
git add .
git status
git commit -m "Preparar Los Magueyes para Netlify"
git remote add origin https://github.com/TU-USUARIO/los-magueyes.git
git push -u origin main
```

Sustituye TU-USUARIO. Si Git solicita identidad, configura tu nombre y correo. Antes del commit, comprueba que los archivos de credenciales no aparecen en `git status`. GitHub Actions ejecutará las pruebas y la verificación al subir cambios.

## 3. Conectar Netlify

En Netlify importa un proyecto desde GitHub y selecciona el repositorio. Si los archivos están en la raíz, deja el directorio base vacío. Configuración:

| Campo | Valor |
|---|---|
| Rama | `main` |
| Build command | `npm run build` |
| Publish directory | `public` |
| Functions directory | `netlify/functions` |
| Node | `22` |

`netlify.toml` proporciona estos valores. No uses `npm start` como comando de compilación. No subas únicamente la carpeta `public` por arrastrar y soltar: se necesita empaquetar también la función. El primer despliegue puede mostrar servicio no disponible mientras completas las variables; no lo compartas como terminado hasta acabar los pasos siguientes.

## 4. Preparar una base MySQL remota

Necesitas una base MySQL compatible, un usuario, contraseña, host, puerto y los requisitos TLS del proveedor. Debe aceptar conexiones desde Netlify. No uses `localhost` ni `127.0.0.1` como host de producción. El script conserva los datos existentes, aunque siempre conviene respaldar una base que ya contiene pedidos.

Copia `.env.production.example` como `.env.production` en tu computadora. En PowerShell puedes usar:

```powershell
Copy-Item .env.production.example .env.production
```

Completa los campos. Genera un secreto de sesión y copia el resultado en `SESSION_SECRET`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Configura `ADMIN_NAME`, `ADMIN_EMAIL` y una contraseña propia de al menos 12 caracteres (máximo 72 bytes). Con la base remota ya creada por el proveedor, ejecuta:

```bash
npm run setup:production
```

Este comando crea tablas e índices, carga los 41 productos iniciales si el catálogo está vacío y crea o actualiza el administrador. No requiere permiso para crear bases. El usuario de preparación sí necesita crear/alterar tablas. El script no elimina pedidos ni sustituye un catálogo existente. No ejecutes `setup:local` para preparar la base remota.

Si el proveedor requiere certificado CA, agrega su contenido en `DB_SSL_CA`, usando `\n` para saltos de línea. No desactives la verificación del certificado.

## 5. Variables en Netlify

Configura estas variables para el contexto de producción y con alcance que incluya **Functions** (o todos los alcances disponibles). No las escribas en el código ni en `netlify.toml`:

| Variable | Qué poner |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL` | URL HTTPS exacta del sitio, por ejemplo `https://tu-sitio.netlify.app` |
| `DB_HOST` | Host remoto del proveedor |
| `DB_PORT` | Puerto del proveedor, normalmente `3306` |
| `DB_NAME` | Nombre de la base creada |
| `DB_USER` | Usuario de MySQL |
| `DB_PASSWORD` | Contraseña de MySQL |
| `DB_SSL` | `true` para conexión TLS remota |
| `DB_SSL_CA` | Certificado si el proveedor lo exige; si no, omitir |
| `DB_CONNECTION_LIMIT` | `2` conexiones por instancia |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 caracteres |
| `TRUST_PROXY_HOPS` | `1` |

`ADMIN_*` solo se necesita para el comando de preparación en tu computadora. No existe una contraseña universal incluida en el proyecto. Cuando cambies variables, realiza un nuevo despliegue. Si cambias a un dominio propio, cambia también `APP_URL` para que los formularios acepten ese origen. Las URL de vistas previas de ramas no deben usar inadvertidamente la base de producción: configura una base y APP_URL separados si necesitas probarlas.

## 6. Comprobar después de publicar

1. Abre `/`, `/nosotros` y `/menu`. Deben aparecer diseño, imágenes y productos.
2. Agrega productos y registra un pedido de prueba: confirma folio y total.
3. Abre `/auth/login` y entra con el administrador preparado.
4. Comprueba nombre, teléfono, dirección y detalle del pedido en `/admin/pedidos`.
5. Modifica el estado y verifica que persista al recargar. Prueba crear, editar y desactivar un producto temporal.
6. Cierra sesión y confirma que `/admin` vuelve a pedir acceso.

## Solución de errores

- **503 al abrir el sitio:** revisa variables de Functions y registros de la función `app`.
- **500 al abrir menú/acceso o enviar pedido:** verifica acceso de red a MySQL, TLS, credenciales y que `setup:production` terminó correctamente.
- **403 al enviar formulario:** APP_URL debe coincidir con el dominio abierto. Recarga para renovar el token y permite cookies.
- **404 en rutas:** verifica que Netlify tomó el `netlify.toml` de la carpeta correcta y desplegó la función `app`.
- **Build fallido:** prueba `npm ci` y `npm run build` localmente; usa Node 22 y sube `package-lock.json`.

Las sesiones se guardan en MySQL y las respuestas dinámicas no se almacenan en caché. Los límites de solicitudes son por instancia de función; no constituyen una cuota global. Para tráfico elevado revisa los límites de conexiones de tu proveedor y la protección de tráfico de Netlify.

Referencia oficial: [Express en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/express/).
