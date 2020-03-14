const Room = require('../models/Room');

const roomController = {
  getAllNamespaceRooms: async namespaceID=> {
      return await Room.find({ namespaceID: namespaceID });
  }
};

module.exports = roomController;
