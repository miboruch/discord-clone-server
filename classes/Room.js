class Room {
  constructor(roomID, roomOwnerID, roomName, isPrivate = false, password = null) {
    this.roomID = roomID;
    this.roomOwnerID = roomOwnerID;
    this.roomName = roomName;
    this.isPrivate = isPrivate;
    this.password = password;
    this.users = [];
    this.chatHistory = [];
  }

  /* messageObject = {messageID, userName, date, avatar? } */
  addNewMessage(messageObject) {
    this.chatHistory.push(messageObject);
  }

  clearHistory() {
    this.chatHistory = [];
  }
}

module.exports = Room;
