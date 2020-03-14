const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
    lastName: req.body.lastName,
    nick: req.body.nick
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
  res.header('auth-token', token).send({ token: token, id: user._id });
};


const userLogout = (req, res) => {
  res.removeHeader('auth-token');
  res.send('User logout');
};


const addNamespaceToUser = async (userID, namespace) => {
  User.findOneAndUpdate({ _id: userID }, { $push: { namespaces: namespace } });
};

module.exports = {
  userRegister,
  userLogin,
  userLogout,
  addNamespaceToUser
};
