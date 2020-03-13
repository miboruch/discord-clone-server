const router = require('express').Router();
const namespace = require('../controllers/NamespaceController');
const privateRoute = require('../middlewares/privateRoute');

router.get('/getAllNamespaces', namespace.getAllNamespaces);
router.post('/create', privateRoute, namespace.createNewNamespace);

module.exports = router;
