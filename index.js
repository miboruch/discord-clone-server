const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socket = require('./socket');
const namespaceController = require('./controllers/NamespaceController');
const roomController = require('./controllers/RoomController');
const socketAuthentication = require('./socket/socketAuthentication');
require('dotenv').config();
const mainConnectionEvents = require('./socket/mainConnectionEvents');

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

const usersOnline = [];

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });

const connection = mongoose.connection;
connection.on('error', error => {
  console.log('Connection error' + error);
});

/* Database connection */
connection.once('open', async () => {
  console.log('Connected to DB');
  const server = app.listen(9000);
  const io = socket.init(server);

  /* Socket with token authentication */
  io.use((socket, next) => {
    socketAuthentication(socket, next);
  }).on('connection', async socket => {
    console.log(socket.decoded);
    if (
      !usersOnline.filter(item => item.userID === socket.decoded._id).length > 0
    ) {
      usersOnline.push({ userID: socket.decoded._id, tokenID: socket.id });
    }
    await mainConnectionEvents(socket);
  });

  /* namespace socket with authentication */
  namespaceController
    .getAllNamespaces()
    .then(namespaces =>
      namespaces.map(item => {
        io.of(`/${item._id}`)
          .use((namespaceSocket, next) => {
            socketAuthentication(namespaceSocket, next);
          })
          .on('connection', namespaceSocket => {
            const currentNamespace = io.of(`/${item._id}`);

            namespaceSocket.emit('load_rooms', 'First room');
            namespaceSocket.emit('namespace_joined', item._id);

            /* create room */
            namespaceSocket.on('create_room', async ({ name, description }) => {
              const savedRoom = await roomController.createNewRoom(
                name,
                description,
                item._id
              );

              /* emit to everyone in the namespace */
              currentNamespace.emit('room_created', savedRoom);
            });
          });
      })
    )
    .catch(error => console.log(error));

  app.use('/user', userRoutes);
});
