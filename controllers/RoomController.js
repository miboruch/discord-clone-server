const mongoose = require('mongoose');
const slugify = require('slugify');
const Room = require('../models/Room');
const messageController = require('../controllers/MessageController');

const getAllNamespaceRooms = async namespaceID => {
  return await Room.find({ namespaceID: namespaceID });
};

const getAllRooms = async () => {
  return await Room.find();
};

const getSingleRoomInfo = async roomID => {
  return await Room.find({ _id: roomID });
};

const createNewRoom = async (name, description, namespaceID) => {
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

/*
    * 1. Remove all messages from this room
    * 2. Remove room itself
*/
const removeSingleRoom = async (roomID, roomName) => {
  try {
    await messageController.removeMessages(`${roomID}${slugify(roomName)}`);
    await Room.findOneAndDelete({ _id: roomID });
    /* emit namespaceSocket load rooms */
    /* emit namespaceSocket success */
  } catch (error) {
    /* emit namespaceSocket error */
    console.log(error);
  }
};

/*
    * Necessary when namespace is being deleted
    * 1. Find all rooms in the namespace
    * 2. Remove all messages from every single room in this namespace
    * 3. Remove room itself
*/
const removeRooms = async namespaceID => {
  try {
    const rooms = await getAllNamespaceRooms(namespaceID);
    console.log(rooms);

    rooms.map(async room => {
      await messageController.removeMessages(
        `${room._id}${slugify(room.name)}`
      );
    });

    await Room.deleteMany({ namespaceID: namespaceID });
    /* emit namespaceSocket load rooms */
    /* emit namespaceSocket success */
  } catch (error) {
    console.log(error);
    /* socket namespaceSocket error */
  }
};

module.exports = {
  getAllNamespaceRooms,
  getAllRooms,
  getSingleRoomInfo,
  createNewRoom,
  removeSingleRoom,
  removeRooms
};
