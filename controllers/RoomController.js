const Room = require('../models/Room');

getAllNamespaceRooms = async namespaceID => {
  return await Room.find({ namespaceID: namespaceID });
};

getAllRooms = async () => {
  return await Room.find();
};

getSingleRoomInfo = async roomID => {
  return await Room.find({ _id: roomID });
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
  getAllRooms,
  getSingleRoomInfo,
  createNewRoom
};
