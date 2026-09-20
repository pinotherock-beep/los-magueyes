const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { setupLocal } = require('../scripts/setup-local');

for (const count of [0, 5]) {
  test(`prepara tablas y administrador; productos existentes: ${count}`, async () => {
    const connection = {
      query: mock.fn(async sql => sql.startsWith('SELECT COUNT') ? [[{ count }]] : []),
      execute: mock.fn(async () => []), end: mock.fn(async () => {})
    };
    const original = mysql.createConnection;
    mysql.createConnection = mock.fn(async () => connection);
    try {
      await setupLocal();
      const sql = connection.query.mock.calls.map(call => call.arguments[0]);
      assert.ok(sql[0].includes('CREATE TABLE IF NOT EXISTS users'));
      assert.ok(!sql[0].includes('DROP TABLE'));
      assert.equal(sql.some(value => value.startsWith('INSERT IGNORE INTO categories')), count === 0);
      const [statement, params] = connection.execute.mock.calls[0].arguments;
      assert.ok(statement.includes('ON DUPLICATE KEY UPDATE'));
      assert.ok(await bcrypt.compare(process.env.ADMIN_PASSWORD, params[2]));
      assert.equal(connection.end.mock.callCount(), 1);
      const options = mysql.createConnection.mock.calls[0].arguments[0];
      assert.equal(options.host, '127.0.0.1');
      assert.equal(options.database, undefined);
    } finally { mysql.createConnection = original; }
  });
}

test('cierra la conexión si falla la preparación y comunica el error', async () => {
  const connection = { query: async () => { throw new Error('Fallo SQL simulado'); }, end: mock.fn(async () => {}) };
  const original = mysql.createConnection;
  mysql.createConnection = async () => connection;
  try {
    await assert.rejects(setupLocal, /Fallo SQL simulado/);
    assert.equal(connection.end.mock.callCount(), 1);
  } finally { mysql.createConnection = original; }
});
