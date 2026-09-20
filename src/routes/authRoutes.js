const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

router.get('/login', authController.showLogin);
router.post('/login', [
  body('email').trim().isEmail().customSanitizer(value => value.toLowerCase()).withMessage('Escribe un correo válido.'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
], authController.login);
router.post('/logout', authController.logout);

module.exports = router;
