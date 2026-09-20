const router = require('express').Router();
const publicController = require('../controllers/publicController');

router.get('/', publicController.home);
router.get('/menu', publicController.menu);
router.get('/nosotros', publicController.about);

module.exports = router;
