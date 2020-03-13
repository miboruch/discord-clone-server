const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(403).send('Access denied');

  try {
    req.user = jwt.verify(token, process.env.TOKEN_SECRET);
    next();
  } catch (error) {
    res.status(404).send('Invalid token');
  }
};
