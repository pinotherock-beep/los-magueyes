const router = require('express').Router();
const { body } = require('express-validator');
const apiController = require('../controllers/apiController');

router.get('/products', apiController.products);
router.post('/orders', [
  body('customerName').trim().isLength({ min: 2, max: 100 }),
  body('address').trim().isLength({ min: 5, max: 250 }),
  body('phone').trim().matches(/^[0-9+()\-\s]{8,20}$/),
  body('orderType').isIn(['local', 'llevar']),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('items').isArray({ min: 1, max: 30 }).bail().custom(items => new Set(items.map(item => String(item?.productId))).size === items.length).withMessage('No repitas productos; usa la cantidad.'),
  body('items.*.productId').isInt({ min: 1 }).toInt(),
  body('items.*.quantity').isInt({ min: 1, max: 20 }).toInt()
], apiController.createOrder);

module.exports = router;
