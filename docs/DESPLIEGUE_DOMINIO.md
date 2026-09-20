# Despliegue seguro de Los Magueyes en un dominio

## 1. Tipo de alojamiento necesario

La aplicación requiere un servicio que ejecute **Node.js 20 o superior** y una base de datos **MySQL 8/MariaDB**. No es un sitio estático, por lo que una publicación directa en Netlify sin adaptar el servidor y la base de datos no funcionará.

Puedes usar un proveedor compatible con Node.js y MySQL o un servidor VPS con Docker. El proveedor debe permitir:

- proceso persistente con `npm start`;
- variables de entorno privadas;
- conexión a MySQL;
- certificado HTTPS para el dominio;
- almacenamiento persistente y copias de seguridad de MySQL.

## 2. Configurar las variables privadas

1. Copia `.env.production.example` como `.env.production` solamente en el servidor.
2. Sustituye todos los valores de ejemplo.
3. Genera una clave de sesión nueva:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Colócala en `SESSION_SECRET`.
5. Escribe el dominio HTTPS definitivo en `APP_URL`, sin ruta final. Ejemplo: `https://www.tudominio.com`.
6. Usa un usuario de MySQL exclusivo para esta aplicación; no uses `root` en un servicio administrado.
7. Mantén `DB_SSL=true` cuando el proveedor de MySQL admita conexiones TLS.

La aplicación detiene el arranque si en producción falta una variable crítica, si `APP_URL` no usa HTTPS o si la clave de sesión es insegura.

## 3. Crear la base de datos

Importa `database/los_magueyes.sql` en la base de datos de producción. El script usa tablas e inserciones idempotentes y no incluye `DROP DATABASE`, por lo que no elimina los pedidos existentes si se ejecuta nuevamente.

Si el proveedor ya creó la base y no permite ejecutar `CREATE DATABASE`, selecciónala desde su panel e importa el script omitiendo únicamente las dos primeras instrucciones (`CREATE DATABASE` y `USE`).

Después crea el administrador una sola vez:

```bash
npm run seed:production
```

Usa una contraseña administrativa única de al menos 12 caracteres. Después de crear al usuario puedes retirar `ADMIN_PASSWORD` de las variables del servicio hasta que necesites cambiarla mediante el mismo comando.

## 4. Despliegue en un proveedor administrado

Configura estos valores en el panel del proveedor:

- comando de instalación: `npm ci --omit=dev`;
- comando de inicio: `npm start`;
- ruta de salud: `/health`;
- puerto: utiliza el valor que el proveedor entregue en `PORT`;
- variables: copia las de `.env.production.example` con valores reales.

No subas archivos `.env`, contraseñas, respaldos SQL con datos reales ni certificados al repositorio.

## 5. Despliegue con Docker en un VPS

Desde la raíz del proyecto, después de crear `.env.production`:

```bash
docker compose --env-file .env.production -f deploy/docker-compose.production.yml up --build -d
docker compose --env-file .env.production -f deploy/docker-compose.production.yml exec web npm run seed
```

Esta configuración:

- no publica MySQL hacia Internet;
- expone Node.js solamente en `127.0.0.1:3000`;
- ejecuta la aplicación con un usuario sin privilegios;
- reinicia los servicios en caso de fallo;
- conserva MySQL en un volumen persistente;
- incluye una comprobación automática de salud.

Configura Nginx o el proxy del proveedor para enviar tráfico HTTPS a `127.0.0.1:3000`. Hay una base en `deploy/nginx.conf.example`. Sustituye el dominio y las rutas de los certificados antes de activarla.

## 6. Conectar el dominio y HTTPS

1. En el proveedor del dominio crea el registro `A` o `CNAME` indicado por el alojamiento.
2. Agrega tanto el dominio principal como `www`, si usarás ambos.
3. Activa el certificado TLS/SSL del proveedor.
4. Define en `APP_URL` exactamente la dirección canónica que abrirán los clientes.
5. Redirige HTTP a HTTPS.
6. Confirma que HTTPS funciona correctamente; la aplicación envía HSTS automáticamente cuando `NODE_ENV=production`.
7. Activa `HSTS_INCLUDE_SUBDOMAINS=true` solamente si todos los subdominios funcionan también con HTTPS.

## 7. Verificación antes de recibir pedidos reales

- Abre `/health` y confirma una respuesta con `"status":"ok"`.
- Abre `/menu`, registra dos pedidos de prueba y comprueba que sus folios sean consecutivos.
- En `/admin/pedidos`, confirma que el pedido más antiguo esté arriba como **Siguiente por atender**.
- Cambia el primer pedido a entregado y verifica que pase al historial.
- Comprueba inicio y cierre de sesión del administrador.
- Revisa que el navegador muestre el candado HTTPS y que no existan errores de contenido bloqueado.
- Ejecuta `npm test` antes de cada publicación.
- Programa respaldos diarios de MySQL y prueba periódicamente su restauración.

## 8. Seguridad incluida

- consultas parametrizadas y cálculo de precios en el servidor;
- contraseña administrativa cifrada con bcrypt;
- cookie de sesión `HttpOnly`, `SameSite=Lax` y `Secure` en producción;
- almacenamiento de sesiones en MySQL;
- protección CSRF y validación del origen de formularios;
- CSP, HSTS, protección contra iframes y restricción de permisos del navegador;
- límites de solicitudes generales, de inicio de sesión y de creación de pedidos;
- límite de tamaño del cuerpo de las solicitudes;
- mensajes internos de error ocultos al visitante;
- cierre controlado de conexiones al detener el servicio.
