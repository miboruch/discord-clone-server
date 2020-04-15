const Namespace = require('../models/Namespace');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

const getAllNamespaces = async () => {
  return await Namespace.find();
};
/* name, ownerID(from private route), isPrivate, password*/
const createNewNamespace = async (
  name,
  ownerID,
  isPrivate,
  password,
  color
) => {
  try {
    const newNamespace = new Namespace({
      name,
      ownerID,
      isPrivate,
      password: isPrivate ? password : null,
      color
    });

    return await newNamespace.save();
  } catch (error) {
    console.log(error);
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

/*
    * DELETE NAMESPACE
    * - Remove namespace from database itself
    * - Remove all rooms connected with this namespace
    * - Remove all messages connected with rooms
 */
// const removeNamespace = async (namespaceID) => {
//
// }

module.exports = {
  getAllNamespaces,
  createNewNamespace,
  getAllUserNamespaces,
  getNamespaceData,
  getNamespacesByName
};
