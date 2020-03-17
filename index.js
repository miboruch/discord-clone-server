const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socket = require('./socket');
const namespaceController = require('./controllers/NamespaceController');
const userController = require('./controllers/UserController');
const roomController = require('./controllers/RoomController');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');

/* MIDDLEWARES */
const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, auth-token'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });

const connection = mongoose.connection;
connection.on('error', error => {
  console.log('Connection error' + error);
});

/* DATABASE CONNECTION OPEN */
connection.once('open', async () => {
  console.log('Connected to DB');
  const server = app.listen(9000, () => console.log('Server is running'));
  const io = socket.init(server);

  /* Socket with token authentication */
  io.use((socket, next) => {
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
    /* Main page connection */
  }).on('connection', async socket => {
    console.log(socket.decoded);
    console.log(socket.id);
    /* send namespaces to the client */
    socket.emit(
      'load_namespaces',
      await namespaceController.getAllUserNamespaces(socket.decoded._id)
    );

    /* User connected */
    socket.on('user_connected', ({ socketID, username }) => {
      console.log(socketID);
      console.log(username);
    });

    /* Create new main room(namespace) */
    socket.on(
      'create_namespace',
      async ({ name, ownerID, isPrivate, password }) => {
        const namespace = await namespaceController.createNewNamespace(
          name,
          ownerID,
          isPrivate,
          password
        );

        socket.emit('namespace_created', namespace);
      }
    );

    /* Join to the main room */
    socket.on('join_namespace', (userID, namespace) => {
      /* update user object - User.namespaces -> push joined namespace */
      userController.addNamespaceToUser(userID, namespace);
    });

    /* Disconnect */
    socket.on('disconnect', () => {
      console.log('DISCONNECTING');
      console.log(socket.id);
    });
  });

  namespaceController
    .getAllNamespaces()
    .then(namespaces =>
      namespaces.map(item => {
        console.log('NAMESPACE ID');
        console.log(item);
        io.of(`/${item._id}`).on('connection', namespaceSocket => {
          console.log(namespaceSocket);
          console.log(
            `${namespaceSocket.id} joined the ${item.name} namespace`
          );
        });
      })
    )
    .catch(error => console.log(error));

  app.use('/user', userRoutes);
});
