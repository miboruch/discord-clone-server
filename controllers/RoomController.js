const Room = require("../classes/Room");
const namespaceController = require("../controllers/NamespaceController");

const createRoom = (
  namespaceID,
  roomOwnerID,
  roomName,
  isPrivate,
  password
) => {
  const room = new Room(roomName, roomOwnerID, isPrivate, password);
  const namespace = namespaceController.getNamespaceByID(namespaceID);
  namespace.addRoom(room);
  console.log(namespace);
};

const joinRoom = (socket, namespaceID, roomID, password) => {
  const [destinationRoom] = namespaceController
    .getAllNamespaceRooms(namespaceID)
    .filter(item => item.roomID === roomID);

  if (destinationRoom.users.includes(socket.id)) {
    socket.emit("join_room_error", "You are already in this room");
  }

  if (destinationRoom.isPrivate) {
    destinationRoom.password !== password
      ? socket.emit("join_room_error", "Incorrect password")
      : socket.join(roomID);
  }
};

module.exports = {
  createRoom,
  joinRoom
};
