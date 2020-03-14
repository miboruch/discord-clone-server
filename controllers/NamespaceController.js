const Namespace = require('../models/Namespace');

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

// getAllNamespaceRooms: async (socket, namespaceID) => {
//   try {
//     const namespaceRooms = await Namespace.find({ _id: namespaceID });
//     socket.emit('load_namespace_rooms', namespaceRooms);
//   } catch (error) {
//     socket.emit('load_namespace_rooms_error', error);
//   }
// }

/*
  TODO:
    - get all namespace rooms! (Room controller)
    - delete namespace
    - get namespace by ID
    - get namespace by name
   */

module.exports = {
  getAllNamespaces,
  createNewNamespace
};
