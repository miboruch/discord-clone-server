const namespaceController = require('../controllers/NamespaceController');
const userController = require('../controllers/UserController');

const mainConnectionEvents = async socket => {
  /* send namespaces to the client */
  socket.emit(
    'load_namespaces',
    await namespaceController.getAllUserNamespaces(socket.decoded._id)
  );

  /* Create new namespace */
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
  });
};

module.exports = mainConnectionEvents;
