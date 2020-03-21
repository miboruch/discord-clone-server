const Room = require('../models/Room');

getAllNamespaceRooms = async namespaceID => {
  return await Room.find({ namespaceID: namespaceID });
};

module.exports = {
  getAllNamespaceRooms
};
