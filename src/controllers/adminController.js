const { sequelize } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

exports.dashboard = asyncHandler(async (req, res) => {
  const [stats] = await sequelize.query(`
    SELECT
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM orders WHERE status = 'pendiente') AS pending,
      (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) AS today_orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status <> 'cancelado') AS today_sales
  `);
  res.render('admin/dashboard', { title: 'Panel administrativo', stats });
});
