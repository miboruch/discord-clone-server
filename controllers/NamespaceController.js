const Namespace = require("../classes/Namespace");
const Room = require("../classes/Room");
const uniqid = require("uniqid");

const namespaces = [];

const defaultNamespace = new Namespace(0, "Default", "/default");
defaultNamespace.addRoom(new Room(0, "test ID", "Test room", false));

namespaces.push(defaultNamespace);

const createNewNamespace = namespaceName => {
  const generatedID = uniqid();
  const namespace = new Namespace(
    generatedID,
    namespaceName,
    `/${generatedID}`
  );
  namespaces.push(namespace);
};

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

const getAllNamespaceRooms = namespaceID => {
  return getNamespaceByID(namespaceID).rooms;
};

module.exports = {
  createNewNamespace,
  getAllNamespaces,
  getNamespaceByID,
  getNamespaceByName,
  getAllNamespaceRooms
};
