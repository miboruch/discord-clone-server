const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socket = require('./socket');
const roomController = require('./controllers/RoomController');
const namespaceController = require('./controllers/NamespaceController');
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
connection.once('open', () => {
  console.log('Connected to DB');
  const server = app.listen(9000, () => console.log('Server is running'));
  const io = socket.init(server);

  io.on('connection', socket => {
    console.log(socket.id);
    roomController.createRoom(0, 'testID', 'Test room name', false, null);
    console.log(namespaceController.getAllNamespaceRooms(0));

    socket.emit('fetch_namespaces', namespaceController.getAllNamespaces());

    socket.on('user_connected', ({ socketID, username }) => {
      console.log(socketID);
      console.log(username);
    });

    socket.on('disconnect', () => {
      console.log('DISCONNECTING');
      console.log(socket.id);
    });

    socket.on('create_namespace', text => {
      namespaceController.createNewNamespace(text);

      socket.emit('namespace_created', namespaceController.getAllNamespaces());
    });

    socket.on('join_namespace', endpoint => {
      socket.emit('namespace_joined', endpoint);
    });
  });

  namespaceController.getAllNamespaces().map(namespace => {
    io.of(namespace.endpoint).on('connection', namespaceSocket => {
      console.log(namespaceSocket);
      console.log(`${namespaceSocket.id} joined the ${namespace} namespace`);

      namespaceSocket.emit(
        'load_rooms',
        namespaceController.getAllNamespaceRooms(namespace.id)
      );
    });
  });
  app.use('/user', userRoutes);
});
