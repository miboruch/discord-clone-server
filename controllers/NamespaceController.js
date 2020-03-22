const Namespace = require('../models/Namespace');
const User = require('../models/User');

const getAllNamespaces = async () => {
  return await Namespace.find();
};
/* name, ownerID(from private route), isPrivate, password*/
const createNewNamespace = async (name, ownerID, isPrivate, password) => {
  try {
    const newNamespace = new Namespace({
      name,
      ownerID,
      isPrivate,
      password: isPrivate ? password : null
    });

    return await newNamespace.save();
  } catch (error) {
    console.log(error);
  }
};

const getAllUserNamespaces = async userID => {
  const userOwnedNamespaces = await Namespace.find({ ownerID: userID });
  const [userJoinedNamespaces] = await User.find({ _id: userID }).select('namespaces');

  return { created: userOwnedNamespaces, joined: userJoinedNamespaces.namespaces };
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
  getAllUserNamespaces
};
