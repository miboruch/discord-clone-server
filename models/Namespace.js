const mongoose = require('mongoose');

const namespaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 255
  },
  ownerID: {
    type: mongoose.Schema.ObjectId
  },
  isPrivate: {
    type: Boolean,
    required: true
  },
  password: {
    type: String,
    required: false,
    max: 1024
  },
  admins: {
    type: Array,
    default: []
  }
});

module.exports = mongoose.model('Namespace', namespaceSchema);
