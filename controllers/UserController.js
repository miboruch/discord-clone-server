const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Namespace = require('../models/Namespace');
const {
  registerValidation,
  loginValidation
} = require('../utils/AuthValidationSchema');

const userRegister = async (req, res) => {
  const { error } = registerValidation(req.body);

  if (error) {
    return res.status(422).send(`Problem with data validation: ${error}`);
  }

  const isAlreadyCreated = await User.findOne({ email: req.body.email });

  if (isAlreadyCreated) {
    return res.status(409).send('Account with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    email: req.body.email,
    password: hashedPassword,
    name: req.body.name,
    lastName: req.body.lastName
  });

  try {
    const savedUser = await user.save();
    const token = jwt.sign({ _id: savedUser._id }, process.env.TOKEN_SECRET);
    res.status(201).send({ ...savedUser, token: token });
  } catch (err) {
    res.status(500).send(err);
  }
};

const userLogin = async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(422).send(`Problem with user login: ${error}`);
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).send('Account with this email does not exists');

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send('Invalid password');

  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
  res.header('auth-token', token).send({
    token: token,
    id: user._id,
    name: user.name,
    lastName: user.lastName
  });
};

const userLogout = (req, res) => {
  res.removeHeader('auth-token');
  res.send('User logout');
};

const addNamespaceToUser = async (userID, namespace, socket) => {
  try {
    const didAlreadyJoined =
      (
        await User.findOne({ _id: userID }).select({
          namespaces: { $elemMatch: { _id: namespace._id } }
        })
      ).namespaces.length > 0;

    const isOwner =
      (await Namespace.find({
        ownerID: userID,
        _id: namespace._id
      }).countDocuments()) > 0;

    if (!isOwner && !didAlreadyJoined) {
      await User.findOneAndUpdate(
        { _id: userID },
        { $push: { namespaces: namespace } }
      );
      socket.emit('information', {
        type: 'success',
        message: 'You have joined to the server'
      });
    } else {
      socket.emit('information', {
        type: 'error',
        message: 'You have already joined this server.'
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const removeNamespaceFromUser = async (namespaceID, userID) => {
  try {
    if (userID) {
      return await User.updateOne(
        {
          _id: userID
        },
        { $pull: { namespaces: { _id: namespaceID } } }
      );
    } else {
      return await User.updateMany(
        {},
        { $pull: { namespaces: { _id: namespaceID } } }
      );
    }
  } catch (error) {
    console.log(error);
  }
};

const getUserName = async (req, res) => {
  const { _id } = req.user;
  const user = await User.findOne({ _id: _id });

  if (!user) return res.status(404).send('User not found');

  res.send({ name: user.name, lastName: user.lastName });
};

const getUserData = async userID => {
  try {
    return await User.findOne({ _id: userID }, { name: 1, lastName: 1, isOnline: 1 });
  } catch (error) {
    console.log(error);
  }
};

const getNamespaceUsers = async namespaceID => {
  try {
    return await User.find(
      {
        namespaces: { $elemMatch: { _id: namespaceID } }
      },
      { name: 1, lastName: 1, isOnline: 1 }
    );
  } catch (error) {
    console.log(error);
  }
};

const checkIfUserOnline = (object, onlineArray) => {
  return onlineArray.some(
    onlineUser => onlineUser.userID === object._id.toString()
  )
    ? { ...object.toObject(), isOnline: true }
    : { ...object.toObject(), isOnline: true };
};

const setUserOnline = async (userID, value) => {
  try {
    await User.findOneAndUpdate({ _id: userID }, { isOnline: value });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  userRegister,
  userLogin,
  userLogout,
  addNamespaceToUser,
  getUserName,
  removeNamespaceFromUser,
  getUserData,
  getNamespaceUsers,
  checkIfUserOnline,
  setUserOnline
};
