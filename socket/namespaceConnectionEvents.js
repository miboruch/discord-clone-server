const slugify = require('slugify');
const socket = require('../socket');
const roomController = require('../controllers/RoomController');
const namespaceController = require('../controllers/NamespaceController');
const messageController = require('../controllers/MessageController');

const namespaceConnectionEvents = async (namespaceSocket, namespace) => {
  const currentNamespace = socket.getIO().of(`/${namespace._id}`);
  const namespaceUsers = [];
  const usersOnline = [];

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

  /* get namespace data */
  namespaceSocket.emit(
    'namespace_data',
    await namespaceController.getNamespaceData(namespace._id)
  );

  /* DELETE NAMESPACE */
  namespaceSocket.on('delete_namespace', async ({ namespaceID }) => {
    currentNamespace.emit('leave_namespace', 'Namespace has been deleted');
    await namespaceController.removeNamespace(namespaceID, namespaceSocket);
  });

  /* refresh namespaces */
  namespaceSocket.on('reload_namespaces', async ({ userID }) => {
    namespaceSocket.emit(
      'namespaces_reloaded',
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
  namespaceSocket.on('delete_room', async ({ roomID, roomName }) => {
    try {
      const room = `${roomID}${slugify(roomName)}`;

      currentNamespace.in(room).emit('leave_room', 'You have left this room');

      currentNamespace.in(room).clients((error, clients) => {
        clients.map(item => {
          currentNamespace.connected[item].leave(room);
        });
      });

      await roomController.removeSingleRoom(roomID, roomName, namespaceSocket);
    } catch (error) {
      namespaceSocket.emit('information', {
        type: 'error',
        message: 'Problem with deleting room'
      });
    }
  });

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

  namespaceSocket.on('namespace_disconnect', () => {
    usersOnline.filter(user => user.userID !== namespaceSocket.decoded._id);
    // namespaceSocket.disconnect();
  });
};

module.exports = namespaceConnectionEvents;
