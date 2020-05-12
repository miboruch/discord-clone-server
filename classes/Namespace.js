class Namespace {
  constructor(id, namespaceName, endpoint) {
    this.id = id;
    this.namespaceName = namespaceName;
    this.endpoint = endpoint;
    this.rooms = [];
  }

  addRoom(roomObject) {
    this.rooms.push(roomObject);
  }
}

module.exports = Namespace;
