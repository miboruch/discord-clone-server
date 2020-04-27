const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    max: 255
  },
  password: {
    type: String,
    required: true,
    max: 1024
  },
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  namespaces: {
    type: Array,
    default: []
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  /* ? */
  friends: {
    type: Array,
    default: []
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
