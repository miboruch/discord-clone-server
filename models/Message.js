const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  roomID: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userID: {
    type: String,
    required: true,
    max: 1024
  },
  date: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model('Message', messageSchema);
