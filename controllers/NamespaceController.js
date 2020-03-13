const Namespace = require('../models/Namespace');
const socket = require('../socket');

const namespace = {
  getAllNamespaces: async (req, res) => {
    try {
      const namespaces = await Namespace.find();

      res.status(200).send(namespaces);
      socket.getIO().emit('load_namespaces', namespaces);
    } catch (error) {
      res.status(500).send(error);
    }
  },
  /* name, ownerID(from private route), isPrivate, password*/
  createNewNamespace: async (req, res) => {
    try {
      const newNamespace = new Namespace({
        name: req.body.name,
        ownerID: req.user._id,
        isPrivate: req.body.isPrivate,
        password: req.body.isPrivate ? req.body.password : null
      });

      const savedNamespace = await newNamespace.save();

      res.status(200).send(savedNamespace);
      socket.getIO().emit('namespace_created', savedNamespace);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  /*
  TODO:
    - get all namespace rooms! (Room controller)
    - delete namespace
    - get namespace by ID
    - get namespace by name
   */
};

module.exports = namespace;
