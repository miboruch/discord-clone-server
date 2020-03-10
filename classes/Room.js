class Room {
  constructor(roomID, roomName, isPrivate = false, password = null) {
    this.roomID = roomID;
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
