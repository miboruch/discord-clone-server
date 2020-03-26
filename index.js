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
    await mainConnectionEvents(socket);
  });

  const rooms = await roomController.getAllRooms();
  const allRooms = rooms.map(room => {
    return { id: room._id.toString(), users: [] };
  });

  console.log(allRooms);

  const namespaceUsers = [];
  /* namespace socket with authentication */
  namespaceController
    .getAllNamespaces()
    .then(namespaces =>
      namespaces.map(item => {
        io.of(`/${item._id}`)
          .use((namespaceSocket, next) => {
            socketAuthentication(namespaceSocket, next);
          })
          .on('connection', async namespaceSocket => {
            const currentNamespace = io.of(`/${item._id}`);
            /* store in online users array */
            if (
              namespaceUsers.filter(
                user => user.userID === namespaceSocket.decoded._id
              ).length === 0
            ) {
              namespaceUsers.push({
                socketID: namespaceSocket.id,
                userID: namespaceSocket.decoded._id
              });
            }
            console.log(namespaceUsers);

            namespaceSocket.leaveAll();

            namespaceSocket.emit('namespace_joined', item._id);

            /* load rooms */
            namespaceSocket.emit(
              'load_rooms',
              await roomController.getAllNamespaceRooms(item._id)
            );

            /* get namespace data */
            namespaceSocket.emit(
              'namespace_data',
              await namespaceController.getNamespaceData(item._id)
            );

            /* create room */
            namespaceSocket.on('create_room', async ({ name, description }) => {
              const savedRoom = await roomController.createNewRoom(
                name,
                description,
                item._id
              );

              /* emit to everyone in the namespace */
              currentNamespace.emit('room_created', savedRoom);
              namespaceSocket.join(savedRoom._id);
              namespaceSocket.emit('user_joined', savedRoom._id);
            });

            /* join room */
            namespaceSocket.on('join_room', roomID => {
              const currentRoom = allRooms.find(room => room.id === roomID);
              namespaceSocket.join(roomID);

              console.log(`user joined room ${roomID}`);

              if (
                currentRoom.users.filter(
                  userID => userID === namespaceSocket.decoded._id
                ).length === 0
              ) {
                currentRoom.users.push(namespaceSocket.decoded._id);
              }

              namespaceSocket.emit('user_joined', roomID);
            });

            /* leave room */
            namespaceSocket.on('leave_room', roomID => {
              namespaceSocket.leave(roomID);

              namespaceSocket.emit('user_left', roomID);
              console.log(`User left room ${roomID}`);
            });

            namespaceSocket.on('disconnect', () => {
              usersOnline.filter(
                user => user.userID !== namespaceSocket.decoded._id
              );
              console.log('disconnected');
            });
          });
      })
    )
    .catch(error => console.log(error));

  app.use('/user', userRoutes);
});
