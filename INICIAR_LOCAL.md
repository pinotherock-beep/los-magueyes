# Trabajar localmente con VS Code y XAMPP

1. Instala Node.js 22 e inicia MySQL en XAMPP.
2. Abre en VS Code la carpeta que contiene `package.json`.
3. Ejecuta `npm ci` y `npm run setup:local`.
4. El comando genera `.env.local` con un secreto y contraseña de administrador aleatorios. Si tu MySQL usa otra contraseña o puerto, ajusta `DB_PASSWORD`, `DB_USER` y `DB_PORT`, y vuelve a ejecutar `npm run setup:local`.
5. Ejecuta `npm run check:local` y `npm start`.
6. Abre http://127.0.0.1:3000/auth/login. Usa `ADMIN_EMAIL` y `ADMIN_PASSWORD` de `.env.local`.

No se incluyen credenciales del archivo original. Si deseas conectar una base local existente, conserva tu configuración privada y respáldala antes de reemplazar archivos. `setup:local` conserva los pedidos y productos; actualiza el administrador del correo indicado.

Para cambiar contraseña, edita `.env.local`, ejecuta `npm run setup:local` y reinicia. Para detener el servidor usa Ctrl+C. Las siguientes veces solo necesitas iniciar MySQL y ejecutar `npm start`.

- ECONNREFUSED: revisa que MySQL esté encendido y el puerto sea correcto.
- Access denied: corrige usuario y contraseña de MySQL.
- Puerto 3000 ocupado: cierra la otra instancia o cambia PORT.
- Formulario vencido: recarga y conserva el mismo host durante la sesión.
- Credenciales incorrectas: ejecuta `npm run check:local` y, si corresponde, `npm run setup:local`.

No abras EJS con Live Server. Para publicar sigue `SUBIR_GITHUB_NETLIFY.md`.
