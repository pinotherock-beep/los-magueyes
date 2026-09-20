const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

async function categories() {
  return sequelize.query('SELECT id, name FROM categories ORDER BY sort_order, name');
}

exports.index = asyncHandler(async (req, res) => {
  const products = await sequelize.query(`
    SELECT p.id, p.name, p.description, p.price, p.available, c.name AS category
    FROM products p JOIN categories c ON c.id = p.category_id
    ORDER BY c.sort_order, p.name
  `);
  res.render('admin/products/index', { title: 'Productos', products });
});

exports.newForm = asyncHandler(async (req, res) => {
  res.render('admin/products/form', {
    title: 'Nuevo producto', product: {}, categories: await categories(), errors: [], action: '/admin/productos'
  });
});

exports.create = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/products/form', {
      title: 'Nuevo producto', product: { ...req.body, available: Boolean(req.body.available) }, categories: await categories(), errors: errors.array(), action: '/admin/productos'
    });
  }
  await sequelize.query(`
    INSERT INTO products (category_id, name, description, price, available, created_at, updated_at)
    VALUES (:category_id, :name, :description, :price, :available, NOW(), NOW())
  `, { replacements: cleanProduct(req.body) });
  req.session.flash = { type: 'success', message: 'Producto agregado correctamente.' };
  res.redirect('/admin/productos');
});

exports.editForm = asyncHandler(async (req, res) => {
  const products = await sequelize.query('SELECT * FROM products WHERE id = :id', {
    replacements: { id: req.params.id }
  });
  if (!products[0]) return res.redirect('/admin/productos');
  res.render('admin/products/form', {
    title: 'Editar producto', product: products[0], categories: await categories(), errors: [], action: `/admin/productos/${req.params.id}`
  });
});

exports.update = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/products/form', {
      title: 'Editar producto', product: { ...req.body, available: Boolean(req.body.available), id: req.params.id }, categories: await categories(), errors: errors.array(), action: `/admin/productos/${req.params.id}`
    });
  }
  await sequelize.query(`
    UPDATE products SET category_id=:category_id, name=:name, description=:description,
    price=:price, available=:available, updated_at=NOW() WHERE id=:id
  `, { replacements: { ...cleanProduct(req.body), id: req.params.id } });
  req.session.flash = { type: 'success', message: 'Producto actualizado.' };
  res.redirect('/admin/productos');
});

exports.remove = asyncHandler(async (req, res) => {
  await sequelize.query('UPDATE products SET available = 0, updated_at = NOW() WHERE id = :id', {
    replacements: { id: req.params.id }
  });
  req.session.flash = { type: 'success', message: 'Producto desactivado sin borrar su historial.' };
  res.redirect('/admin/productos');
});

function cleanProduct(body) {
  return {
    category_id: body.category_id,
    name: body.name,
    description: body.description || '',
    price: body.price,
    available: body.available ? 1 : 0
  };
}
