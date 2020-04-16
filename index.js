const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socket = require('./socket');
const namespaceController = require('./controllers/NamespaceController');
const roomController = require('./controllers/RoomController');
const messageController = require('./controllers/MessageController');
const userController = require('./controllers/UserController');
const socketAuthentication = require('./socket/socketAuthentication');
const Namespace = require('./models/Namespace');
const namespaceModule = require('./modules/namespacesModule');
require('dotenv').config();
const mainConnectionEvents = require('./socket/mainConnectionEvents');
const helperModule = require('./utils/helpers');

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

  const namespaceUsers = [];

  const namespaceEventEmitter = Namespace.watch();

  namespaceEventEmitter.on('change', async change => {
    if (change.operationType === 'insert') {
      namespaceModule.namespaces = change.fullDocument;
    }
  });

  /*
   * it creates namespace array listener
   * whenever we set namespaceModule.namespace - callback
   * will be executed
   */
  namespaceModule.subscribe(value => {
    value.map(item => {
      io.of(`/${item._id}`)
        .use((namespaceSocket, next) => {
          socketAuthentication(namespaceSocket, next);
        })
        .on('connection', async namespaceSocket => {
          console.log(namespaceSocket.decoded);
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

          namespaceSocket.emit('namespace_joined', item);
          console.log(`joined namespace ${item._id}`);

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
            console.log('CREATE ROOM');
            const savedRoom = await roomController.createNewRoom(
              name,
              description,
              item._id
            );

            allRooms.push({
              id: savedRoom._id.toString(),
              users: [namespaceSocket.decoded._id]
            });

            const namespaceRooms = await roomController.getAllNamespaceRooms(
              item._id
            );

            /* emit to everyone in the namespace */
            currentNamespace.emit('room_created', namespaceRooms);
            namespaceSocket.join(savedRoom._id);
            namespaceSocket.emit('user_joined', savedRoom._id.toString());
          });

          /* LEAVE ROOM */
          namespaceSocket.on('leave_room', roomName => {
            console.log('LEAVE ROOM EVENT');
            namespaceSocket.leave(roomName, () => {
              currentNamespace.in(roomName).clients((error, clients) => {
                currentNamespace
                  .in(roomName)
                  .emit('members_update', clients.length);
              });
            });
          });

          /* JOIN ROOM */
          namespaceSocket.on('join_room', async ({ roomName, roomID }) => {
            try {
              const [currentRoomInfo] = await roomController.getSingleRoomInfo(
                roomID
              );

              namespaceSocket.join(roomName, () => {
                currentNamespace.in(roomName).clients((error, clients) => {
                  console.log(clients);
                  currentNamespace
                    .in(roomName)
                    .emit('members_update', clients.length);
                });
              });

              namespaceSocket.emit('user_joined', {
                roomName: roomName,
                roomInfo: currentRoomInfo
              });

              namespaceSocket.emit(
                'history_catchup',
                await messageController.fetchHistoryMessages(roomName)
              );
            } catch (error) {
              namespaceSocket.emit('error', 'Error with joining to the room');
            }
          });



          /* USER IS TYPING */
          namespaceSocket.on(
            'user_typing',
            ({ room, userID, name, lastName }) => {
              namespaceSocket.broadcast
                .to(room)
                .emit('user_is_typing', { userID, name, lastName });
            }
          );

          /* USER STOPPED TYPING */
          namespaceSocket.on(
            'user_finished_typing',
            ({ room, userID, name, lastName }) => {
              namespaceSocket.broadcast
                .to(room)
                .emit('user_is_not_typing', { userID, name, lastName });
            }
          );

          /* SEND RECEIVED MESSAGE */
          namespaceSocket.on(
            'send_message',
            async ({ message, room, userName, userID }) => {
              const savedMessage = await messageController.saveMessage(
                message,
                room,
                userName.name,
                userName.lastName,
                userID
              );

              currentNamespace.to(room).emit('new_message', savedMessage);
            }
          );

          namespaceSocket.on('namespace_disconnect', () => {
            usersOnline.filter(
              user => user.userID !== namespaceSocket.decoded._id
            );
            // namespaceSocket.disconnect();
          });
        });
    });
  });

  namespaceModule.namespaces = await namespaceController.getAllNamespaces();

  app.use('/user', userRoutes);
});
