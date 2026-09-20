async function check() {
  require('../src/config/local').loadLocalEnvironment();
  const { pool } = require('../src/config/database');
  try {
    for (const table of ['users', 'categories', 'products', 'orders', 'order_items', 'sessions']) {
      await pool.query(`SELECT 1 FROM \`${table}\` LIMIT 1`);
    }
    const [users] = await pool.execute("SELECT password_hash FROM users WHERE email = ? AND role = 'admin' AND active = 1", [process.env.ADMIN_EMAIL.trim().toLowerCase()]);
    if (!users[0] || !await require('bcryptjs').compare(process.env.ADMIN_PASSWORD, users[0].password_hash)) {
      throw new Error('El administrador no coincide con .env.local. Ejecuta npm run setup:local.');
    }
    console.log('Configuración local, conexión, tablas y contraseña del administrador: correctas.');
  } finally { await pool.end(); }
}
check().catch(error => { console.error('Verificación local:', error.message); process.exitCode = 1; });
