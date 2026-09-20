const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

exports.products = asyncHandler(async (req, res) => {
  const products = await sequelize.query(`
    SELECT p.id, p.name, p.description, p.price, c.name AS category
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.available = 1 ORDER BY c.sort_order, p.name
  `);
  res.json({ products });
});

exports.createOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: 'Revisa los datos del pedido.', errors: errors.array() });

  const uniqueIds = [...new Set(req.body.items.map(item => item.productId))];
  const placeholders = uniqueIds.map((_, index) => `:id${index}`).join(',');
  const replacements = Object.fromEntries(uniqueIds.map((id, index) => [`id${index}`, id]));
  const products = await sequelize.query(
    `SELECT id, name, price FROM products WHERE available=1 AND id IN (${placeholders})`,
    { replacements }
  );
  if (products.length !== uniqueIds.length) return res.status(422).json({ message: 'Uno de los productos ya no está disponible.' });

  const byId = new Map(products.map(product => [product.id, product]));
  const items = req.body.items.map(item => ({ ...item, price: Number(byId.get(item.productId).price) }));
  const total = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;

  const result = await sequelize.transaction(async transaction => {
    const [orderId] = await sequelize.query(`
      INSERT INTO orders (customer_name, address, phone, order_type, notes, status, total, created_at, updated_at)
      VALUES (:customerName, :address, :phone, :orderType, :notes, 'pendiente', :total, NOW(), NOW())
    `, {
      replacements: {
        customerName: req.body.customerName,
        address: req.body.address,
        phone: req.body.phone,
        orderType: req.body.orderType,
        notes: req.body.notes || '',
        total
      },
      transaction
    });
    for (const item of items) {
      await sequelize.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, created_at, updated_at)
        VALUES (:orderId, :productId, :quantity, :price, :subtotal, NOW(), NOW())
      `, {
        replacements: { orderId, productId: item.productId, quantity: item.quantity, price: item.price, subtotal: Math.round(item.price * 100) * item.quantity / 100 },
        transaction
      });
    }
    return orderId;
  });

  const orderNumber = String(result).padStart(4, '0');
  res.status(201).set('Cache-Control', 'no-store').json({
    message: 'Pedido recibido correctamente.',
    orderId: result,
    orderNumber,
    total
  });
});
