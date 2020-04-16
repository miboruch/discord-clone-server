const namespaceController = require('../controllers/NamespaceController');
const userController = require('../controllers/UserController');
const namespaceModule = require('../modules/namespacesModule');
const roomController = require('../controllers/RoomController');

const mainConnectionEvents = async socket => {
  /* send namespaces to the client */
  socket.emit(
    'load_namespaces',
    await namespaceController.getAllUserNamespaces(socket.decoded._id)
  );

  /* Create new namespace */
  socket.on(
    'create_namespace',
    async ({ name, ownerID, isPrivate, password, color }) => {
      console.log(name, ownerID, isPrivate, color);
      const namespace = await namespaceController.createNewNamespace(
        name,
        ownerID,
        isPrivate,
        password,
        color
      );

      socket.emit('namespace_created', namespace);
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

  socket.on('leave_namespace', async ({ namespaceID, userID }) => {
    await userController.removeNamespaceFromUser(namespaceID, userID);

    /* move it into controller */
    socket.emit('information', {
      type: 'success',
      message: 'You have been removed from this server'
    });

    socket.emit('left_namespace', 'You have left the server');
    socket.emit(
      'load_namespaces',
      await namespaceController.getAllUserNamespaces(socket.decoded._id)
    );
  });

  /* Disconnect */
  socket.on('disconnect', () => {
    console.log('DISCONNECTING');
  });
};

module.exports = mainConnectionEvents;
