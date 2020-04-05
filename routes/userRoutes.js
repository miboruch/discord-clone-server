const router = require('express').Router();
const user = require('../controllers/UserController');
const privateRoute = require('../middlewares/privateRoute');

router.post('/register', user.userRegister);
router.post('/login', user.userLogin);
router.post('/logout', user.userLogout);
router.get('/user-name', privateRoute, user.getUserName);

module.exports = router;
