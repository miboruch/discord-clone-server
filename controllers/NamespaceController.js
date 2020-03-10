const Namespace = require("../classes/Namespace");
const Room = require("../classes/Room");

const namespaces = [];

const defaultNamespace = new Namespace(0, "Default", "/default");
defaultNamespace.addRoom(new Room(0, "Test room", false));

namespaces.push(defaultNamespace);

const getAllNamespaces = () => {
  return namespaces;
};

const getNamespaceByID = id => {
  const [namespace] = namespaces.filter(namespace => namespace.id === id);
  if (!namespace) {
    return false;
  }
  return namespace;
};

const getNamespaceByName = name => {
  return namespaces.filter(namespace => namespace.namespaceName.includes(name));
};

module.exports = {
  getAllNamespaces,
  getNamespaceByID,
  getNamespaceByName
};
