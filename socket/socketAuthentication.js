const jwt = require('jsonwebtoken');

const socketAuthentication = (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(
      socket.handshake.query.token,
      process.env.TOKEN_SECRET,
      (error, decoded) => {
        if (error) {
          return next(new Error('Authentication error'));
        }
        socket.decoded = decoded;
        next();
      }
    );
  } else {
    next(new Error('Authentication error'));
  }
};

module.exports = socketAuthentication;
