const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 255
  },
  description: {
    type: String,
    required: true,
    max: 255
  },
  namespaceID: {
    type: mongoose.Schema.ObjectId
  },
  isPrivate: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('Room', roomSchema);
