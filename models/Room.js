const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 255
  },
  ownerID: {
    type: mongoose.Schema.ObjectId
  },
  namespaceID: {
    type: mongoose.Schema.ObjectId
  },
  isPrivate: {
    type: Boolean,
    required: true
  },
  password: {
    type: String,
    required: true,
    max: 1024
  }
});

module.exports = mongoose.model('Room', roomSchema);
