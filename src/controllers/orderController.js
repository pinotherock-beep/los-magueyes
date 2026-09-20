const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

exports.index = asyncHandler(async (req, res) => {
  const activeOrders = await sequelize.query(`
    SELECT o.*, GROUP_CONCAT(CONCAT(oi.quantity, ' x ', p.name) ORDER BY oi.id SEPARATOR ', ') AS detail
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status IN ('pendiente', 'preparando', 'listo')
    GROUP BY o.id
    ORDER BY o.created_at ASC, o.id ASC
    LIMIT 100
  `);
  const historyOrders = await sequelize.query(`
    SELECT o.*, GROUP_CONCAT(CONCAT(oi.quantity, ' x ', p.name) ORDER BY oi.id SEPARATOR ', ') AS detail
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status IN ('entregado', 'cancelado')
    GROUP BY o.id
    ORDER BY o.updated_at DESC, o.id DESC
    LIMIT 50
  `);
  const queue = activeOrders.map((order, index) => ({ ...order, queuePosition: index + 1 }));
  res.render('admin/orders/index', { title: 'Pedidos', orders: queue, historyOrders });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).redirect('/admin/pedidos');
  await sequelize.query('UPDATE orders SET status=:status, updated_at=NOW() WHERE id=:id', {
    replacements: { id: req.params.id, status: req.body.status }
  });
  req.session.flash = { type: 'success', message: 'Estado del pedido actualizado.' };
  res.redirect('/admin/pedidos');
});
