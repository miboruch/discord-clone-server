const Room = require("../classes/Room");
const namespaceController = require("../controllers/NamespaceController");

const createRoom = (namespaceID, roomName, isPrivate, password) => {
  const room = new Room(roomName, isPrivate, password);
  const namespace = namespaceController.getNamespaceByID(namespaceID);
  console.log(namespace);
};

module.exports = {
  createRoom
};
