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
      .skip(skip)
      .limit(10);
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
  removeMessages
};
