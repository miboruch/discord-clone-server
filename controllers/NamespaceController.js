const Namespace = require('../models/Namespace');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const roomController = require('../controllers/RoomController');
const userController = require('../controllers/UserController');

const getAllNamespaces = async () => {
  return await Namespace.find();
};

const createNewNamespace = async (
  name,
  ownerID,
  isPrivate,
  password,
  color,
  socket
) => {
  try {
    const newNamespace = new Namespace({
      name,
      ownerID,
      isPrivate,
      password: isPrivate ? password : null,
      color
    });

    const savedNamespace = await newNamespace.save();
    socket.emit('namespace_created', savedNamespace);
    socket.emit('information', {
      type: 'success',
      message: `${savedNamespace.name} server has been created`
    });
  } catch (error) {
    socket.emit('information', {
      type: 'error',
      message: 'Problems with creating namespace'
    });
  }
};

const getAllUserNamespaces = async userID => {
  const userOwnedNamespaces = await Namespace.find({ ownerID: userID });
  const [userJoinedNamespaces] = await User.find({ _id: userID }).select(
    'namespaces'
  );

  return {
    created: userOwnedNamespaces,
    joined: userJoinedNamespaces ? userJoinedNamespaces.namespaces : []
  };
};

const getNamespaceData = async namespaceID => {
  return await Namespace.find({ _id: namespaceID });
};

const getNamespacesByName = async namespaceName => {
  try {
    return await Namespace.find({ name: { $regex: namespaceName } });
  } catch (error) {
    console.log(error);
  }
};

const getNamespaceUsers = async namespaceID => {
  try {
    const { ownerID } = await Namespace.findOne({
      _id: namespaceID
    }).select('ownerID');
    const ownerUserData = await userController.getUserData(ownerID);
    const joinedUsers = await userController.getNamespaceUsers(
      namespaceID.toString()
    );

    return [ownerUserData, ...joinedUsers];
  } catch (error) {
    console.log(error);
  }
};

/*
 * DELETE NAMESPACE
 * - Remove all messages connected with rooms
 * - Remove all rooms connected with this namespace
 * - Remove namespace from database itself
 */

const removeNamespace = async (
  namespaceID,
  namespaceSocket,
  currentNamespace
) => {
  try {
    await roomController.removeRooms(namespaceID);
    // This will remove all messages and rooms itself
    await userController.removeNamespaceFromUser(namespaceID);

    await Namespace.findOneAndDelete({ _id: namespaceID });
    currentNamespace.emit('leave_namespace', namespaceID);
    currentNamespace.emit('information', {
      type: 'success',
      message: 'This server has been deleted'
    });
  } catch (error) {
    namespaceSocket.emit('information', {
      type: 'error',
      message: 'Problem with deleting server'
    });
  }
};

module.exports = {
  getAllNamespaces,
  createNewNamespace,
  getAllUserNamespaces,
  getNamespaceData,
  getNamespacesByName,
  removeNamespace,
  getNamespaceUsers
};
