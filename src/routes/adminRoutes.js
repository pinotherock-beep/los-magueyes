const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

router.use(requireAuth, requireAdmin);
router.get('/', adminController.dashboard);
router.get('/productos', productController.index);
router.get('/productos/nuevo', productController.newForm);
router.post('/productos', productValidation(), productController.create);
router.get('/productos/:id/editar', idValidation(), productController.editForm);
router.post('/productos/:id', idValidation(), productValidation(), productController.update);
router.post('/productos/:id/eliminar', idValidation(), productController.remove);
router.get('/pedidos', orderController.index);
router.post('/pedidos/:id/estado', idValidation(), [
  body('status').isIn(['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'])
], orderController.updateStatus);

function idValidation() {
  return [param('id').isInt({ min: 1 }).toInt(), (req, res, next) => {
    if (!validationResult(req).isEmpty()) return res.status(400).send('Identificador inválido.');
    next();
  }];
}

function productValidation() {
  return [
    body('category_id').isInt({ min: 1 }).toInt().withMessage('Selecciona una categoría.'),
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('El nombre debe tener de 2 a 120 caracteres.'),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body('price').isFloat({ min: 0, max: 99999 }).toFloat().withMessage('Escribe un precio válido.'),
    body('available').optional().toBoolean()
  ];
}

module.exports = router;
