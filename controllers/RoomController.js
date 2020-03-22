const Room = require('../models/Room');

getAllNamespaceRooms = async namespaceID => {
  return await Room.find({ namespaceID: namespaceID });
};

createNewRoom = async (name, description, namespaceID) => {
  try {
    const newRoom = new Room({
      name,
      description,
      namespaceID
    });

    return await newRoom.save();
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getAllNamespaceRooms,
  createNewRoom
};
