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

const createNewRoom = async (
  name,
  description,
  namespaceID,
  namespaceSocket
) => {
  try {
    const newRoom = new Room({
      name,
      description,
      namespaceID
    });

    const savedRoom = await newRoom.save();
    namespaceSocket.join(savedRoom._id);
    namespaceSocket.emit('user_joined', savedRoom._id.toString());
    namespaceSocket.emit('information', {
      type: 'success',
      message: `${savedRoom.name} has been created`
    });
  } catch (error) {
    namespaceSocket.emit('information', {
      type: 'error',
      message: 'Problem with creating new room'
    });
  }
};

/*
 * 1. Remove all messages from this room
 * 2. Remove room itself
 */
const removeSingleRoom = async (
  roomID,
  roomName,
  namespaceID,
  namespaceSocket,
  currentNamespace
) => {
  try {
    const room = `${roomID}${slugify(roomName)}`;

    currentNamespace.in(room).emit('leave_room');

    currentNamespace.in(room).clients((error, clients) => {
      clients.map(item => {
        currentNamespace.connected[item].leave(room);
      });
    });

    await messageController.removeMessages(room);
    await Room.findOneAndDelete({ _id: roomID });

    currentNamespace.emit(
      'load_rooms',
      await getAllNamespaceRooms(namespaceID)
    );

    namespaceSocket.emit('information', {
      type: 'success',
      message: 'Room has been deleted'
    });
  } catch (error) {
    namespaceSocket.emit('information', {
      type: 'error',
      message: 'Problem with deleting room'
    });
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
