const router = require('express').Router();
const user = require('../controllers/UserController');

router.post('/register', user.userRegister);
router.post('/login', user.userLogin);
router.post('/logout', user.userLogout);

module.exports = router;
