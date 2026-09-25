require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { sequelize } = require('../../src/config/database');
const docsRoutes = require('../../src/routes/docsRoutes');
const openapi = require('../../src/docs/catalogOpenapi');

const app = express();
const PORT = Number(process.env.CATALOG_PORT) || 4001;
app.disable('x-powered-by');
app.use(helmet());
app.use('/api-docs', docsRoutes(openapi));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'catalog-service' }));
app.get('/api/catalog', async (req, res, next) => {
  try {
    const products = await sequelize.query(`
      SELECT p.id, p.name, p.description, p.price, c.name AS category
      FROM products p JOIN categories c ON c.id=p.category_id
      WHERE p.available=1 ORDER BY c.sort_order, p.name
    `);
    res.json({ products });
  } catch (error) { next(error); }
});
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Error interno del catálogo.' });
});

async function start() {
  await sequelize.authenticate();
  app.listen(PORT, () => console.log(`Catalog service en puerto ${PORT}`));
}

if (require.main === module) start().catch(error => {
  console.error(error);
  process.exit(1);
});

module.exports = app;
