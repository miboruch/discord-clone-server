const Namespace = require('../models/Namespace');
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
  TODO:
    - delete namespace (only namespace owner)
    - get namespace by ID (necessary for searching)
    - get namespace by name (necessary for searching)
*/

module.exports = {
  getAllNamespaces,
  createNewNamespace,
  getAllUserNamespaces,
  getNamespaceData,
  getNamespacesByName
};
