const slugify = require('slugify');
const socket = require('../socket');
const roomController = require('../controllers/RoomController');
const namespaceController = require('../controllers/NamespaceController');
const messageController = require('../controllers/MessageController');

const namespaceConnectionEvents = async (namespaceSocket, namespace) => {
  const namespaceUsers = [];
  const usersOnline = [];

  console.log(namespaceSocket.decoded);
  const currentNamespace = socket.getIO().of(`/${namespace._id}`);

  /* store in online users array */
  if (
    namespaceUsers.filter(user => user.userID === namespaceSocket.decoded._id)
      .length === 0
  ) {
    namespaceUsers.push({
      socketID: namespaceSocket.id,
      userID: namespaceSocket.decoded._id
    });
  }

  namespaceSocket.emit('namespace_joined', namespace);
  console.log(`joined namespace ${namespace._id}`);

  /* load rooms */
  namespaceSocket.emit(
    'load_rooms',
    await roomController.getAllNamespaceRooms(namespace._id)
  );

  /* get namespace data */
  namespaceSocket.emit(
    'namespace_data',
    await namespaceController.getNamespaceData(namespace._id)
  );

  /* create room */
  namespaceSocket.on('create_room', async ({ name, description }) => {
    console.log('CREATE ROOM');
    const savedRoom = await roomController.createNewRoom(
      name,
      description,
      namespace._id
    );

    const namespaceRooms = await roomController.getAllNamespaceRooms(
      namespace._id
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
        currentNamespace.in(roomName).emit('members_update', clients.length);
      });
    });
  });

  /* JOIN ROOM */
  namespaceSocket.on('join_room', async ({ roomName, roomID }) => {
    try {
      const [currentRoomInfo] = await roomController.getSingleRoomInfo(roomID);

      namespaceSocket.join(roomName, () => {
        currentNamespace.in(roomName).clients((error, clients) => {
          console.log(clients);
          currentNamespace.in(roomName).emit('members_update', clients.length);
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
  namespaceSocket.on('user_typing', ({ room, userID, name, lastName }) => {
    namespaceSocket.broadcast
      .to(room)
      .emit('user_is_typing', { userID, name, lastName });
  });

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

  /* DELETE NAMESPACE */
  namespaceSocket.on('delete_namespace', async ({ namespaceID }) => {
    currentNamespace.emit('leave_namespace', 'Namespace has been deleted');
    await namespaceController.removeNamespace(namespaceID);
    namespaceSocket.emit('information', {
      type: 'success',
      message: 'Namespace has been deleted'
    });
  });

  /* refresh namespaces */
  namespaceSocket.on('reload_namespaces', async ({ userID }) => {
    namespaceSocket.emit(
      'namespaces_reloaded',
      await namespaceController.getAllUserNamespaces(userID)
    );
  });

  namespaceSocket.on('delete_room', async ({ roomID, roomName }) => {
    try {
      const room = `${roomID}${slugify(roomName)}`;

      currentNamespace.in(room).emit('leave_room', 'You have left this room');

      currentNamespace.in(room).clients((error, clients) => {
        console.log(clients);
        clients.map(item => {
          currentNamespace.connected[item].leave(room);
        });
      });

      await roomController.removeSingleRoom(roomID, roomName);

      namespaceSocket.emit('information', {
        type: 'success',
        message: 'Room has been deleted'
      });
    } catch (error) {
      console.log(error);
    }
  });

  namespaceSocket.on('namespace_disconnect', () => {
    usersOnline.filter(user => user.userID !== namespaceSocket.decoded._id);
    // namespaceSocket.disconnect();
  });
};

module.exports = namespaceConnectionEvents;
