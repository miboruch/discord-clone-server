const namespaceController = require('../controllers/NamespaceController');
const userController = require('../controllers/UserController');
const onlineUsers = require('../modules/onlineUsers');

const mainConnectionEvents = async socket => {
  await userController.setUserOnline(socket.decoded._id, true);
  if (
    onlineUsers.onlineUsers.some(user => user.userID === socket.decoded._id)
  ) {
    const index = onlineUsers.onlineUsers.findIndex(
      item => item.userID === socket.decoded._id
    );
    onlineUsers.onlineUsers[index].socketID = socket.id;
  } else {
    onlineUsers.onlineUsers.push({
      socketID: socket.id,
      userID: socket.decoded._id
    });
  }

  /* send namespaces to the client */
  socket.emit(
    'load_namespaces',
    await namespaceController.getAllUserNamespaces(socket.decoded._id)
  );

  /* Create new namespace */
  socket.on(
    'create_namespace',
    async ({ name, ownerID, isPrivate, password, color }) => {
      await namespaceController.createNewNamespace(
        name,
        ownerID,
        isPrivate,
        password,
        color,
        socket
      );
    }
  );

  socket.on('search_namespace_by_id', async namespaceID => {
    const namespace = await namespaceController.getNamespaceData(namespaceID);
    socket.emit('namespace_search_finished', namespace);
  });

  socket.on('search_namespace_by_name', async namespaceName => {
    const namespaces = await namespaceController.getNamespacesByName(
      namespaceName
    );
    socket.emit('namespace_search_finished', namespaces);
  });

  /* Join to the main room */
  socket.on('new_namespace_join', async ({ userID, namespace }) => {
    /* update user object - User.namespaces -> push joined namespace */
    await userController.addNamespaceToUser(userID, namespace, socket);

    socket.emit(
      'load_namespaces',
      await namespaceController.getAllUserNamespaces(userID)
    );
  });

  /* Disconnect */
  socket.on('disconnect', async () => {
    console.log('DISCONNECTING');
    await userController.setUserOnline(socket.decoded._id, false);
    const index = onlineUsers.onlineUsers.findIndex(
      item => item.userID === socket.decoded._id
    );
    index > -1 && onlineUsers.onlineUsers.splice(index, 1);
  });
};

module.exports = mainConnectionEvents;
