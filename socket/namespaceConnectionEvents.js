const socket = require('../socket');
const roomController = require('../controllers/RoomController');
const namespaceController = require('../controllers/NamespaceController');
const messageController = require('../controllers/MessageController');
const userController = require('../controllers/UserController');

const namespaceConnectionEvents = async (namespaceSocket, namespace) => {
  const currentNamespace = socket.getIO().of(`/${namespace._id}`);

  /*
   * 1. Namespaces
   *     - namespace_joined
   *     - get namespace data
   *     - delete namespace
   *     - reload namespace
   * 2. Rooms
   *     - load rooms
   *     - join room
   *     - leave room
   *     - create room
   *     - delete room
   * 3. Messages
   *     - user started typing
   *     - user finished typing
   *     - send message to the room
   */

  //! NAMESPACES
  namespaceSocket.emit('namespace_joined', namespace);

  currentNamespace.emit(
    'update_users',
    await namespaceController.getNamespaceUsers(namespace._id)
  );

  /* DELETE NAMESPACE */
  namespaceSocket.on('delete_namespace', async ({ namespaceID }) => {
    await namespaceController.removeNamespace(
      namespaceID,
      namespaceSocket,
      currentNamespace
    );
  });

  /* refresh namespaces */
  namespaceSocket.on('reload_namespaces', async ({ userID }) => {
    namespaceSocket.emit(
      'namespaces_reloaded',
      await namespaceController.getAllUserNamespaces(userID)
    );
  });

  /* leave namespace */
  namespaceSocket.on('leave_namespace', async ({ namespaceID, userID }) => {
    await userController.removeNamespaceFromUser(
      namespaceID,
      userID,
      namespaceSocket
    );

    currentNamespace.emit(
      'update_users',
      await namespaceController.getNamespaceUsers(namespace._id)
    );

    namespaceSocket.emit('information', {
      type: 'success',
      message: 'You have been removed from this server'
    });

    namespaceSocket.emit('left_namespace', 'You have left the server');

    namespaceSocket.emit(
      'load_namespaces',
      await namespaceController.getAllUserNamespaces(userID)
    );
  });

  //! ROOMS

  //* LOAD ROOMS
  namespaceSocket.emit(
    'load_rooms',
    await roomController.getAllNamespaceRooms(namespace._id)
  );

  //* JOIN ROOM
  namespaceSocket.on('join_room', async ({ roomName, roomID }) => {
    try {
      const [currentRoomInfo] = await roomController.getSingleRoomInfo(roomID);

      namespaceSocket.join(roomName, () => {
        currentNamespace.in(roomName).clients((error, clients) => {
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

  //* LEAVE ROOM
  namespaceSocket.on('leave_room', roomName => {
    namespaceSocket.leave(roomName, () => {
      currentNamespace.in(roomName).clients((error, clients) => {
        currentNamespace.in(roomName).emit('members_update', clients.length);
      });
    });
  });

  //* CREATE ROOM
  namespaceSocket.on('create_room', async ({ name, description }) => {
    await roomController.createNewRoom(
      name,
      description,
      namespace._id,
      namespaceSocket
    );

    const namespaceRooms = await roomController.getAllNamespaceRooms(
      namespace._id
    );

    /* emit to everyone in the namespace */
    currentNamespace.emit('room_created', namespaceRooms);
  });

  //* DELETE ROOM
  namespaceSocket.on(
    'delete_room',
    async ({ roomID, roomName, namespaceID }) => {
      await roomController.removeSingleRoom(
        roomID,
        roomName,
        namespaceID,
        namespaceSocket,
        currentNamespace
      );
    }
  );

  //! MESSAGES

  //* USER STARTED TYPING
  namespaceSocket.on('user_typing', ({ room, userID, name, lastName }) => {
    namespaceSocket.broadcast
      .to(room)
      .emit('user_is_typing', { userID, name, lastName });
  });

  //* USER FINISHED TYPING
  namespaceSocket.on(
    'user_finished_typing',
    ({ room, userID, name, lastName }) => {
      namespaceSocket.broadcast
        .to(room)
        .emit('user_is_not_typing', { userID, name, lastName });
    }
  );

  //* SEND MESSAGE TO THE ROOM
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

  namespaceSocket.on('load_history_by_data', async ({roomID, date}) => {
    await messageController.fetchHistoryMessagesByDate(roomID, date, namespaceSocket);
  })

  namespaceSocket.on('namespace_disconnect', () => {
    // namespaceSocket.disconnect();
  });
};

module.exports = namespaceConnectionEvents;
