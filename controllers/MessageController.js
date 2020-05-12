const Message = require('../models/Message');

const saveMessage = async (message, roomID, name, lastName, userID) => {
  try {
    const newMessage = new Message({
      message,
      roomID,
      name,
      lastName,
      userID,
      date: new Date()
    });

    return await newMessage.save();
  } catch (error) {
    console.log(error);
  }
};

/* Skip is the number how many messages * 10 we have to skip */
const fetchHistoryMessages = async (roomID, skip = 0) => {
  try {
    return await Message.find({ roomID: roomID })
      .sort({ date: -1 })
      .limit(20);
  } catch (error) {
    console.log(error);
  }
};

const fetchHistoryMessagesByDate = async (roomID, date, namespaceSocket) => {
  try {
    const messages = await Message.find({
      roomID: roomID,
      date: { $lt: date }
    })
      .sort({ date: -1 })
      .limit(10);

    namespaceSocket.emit('load_history', messages);
  } catch (error) {
    console.log(error);
  }
};

const removeMessages = async roomName => {
  try {
    await Message.deleteMany({ roomID: roomName });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  saveMessage,
  fetchHistoryMessages,
  removeMessages,
  fetchHistoryMessagesByDate
};
