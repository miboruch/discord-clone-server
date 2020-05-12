const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socket = require('./socket');
const namespaceController = require('./controllers/NamespaceController');
const socketAuthentication = require('./socket/socketAuthentication');
const Namespace = require('./models/Namespace');
const namespaceModule = require('./modules/namespacesModule');
require('dotenv').config();
const mainConnectionEvents = require('./socket/mainConnectionEvents');
const namespaceConnectionEvent = require('./socket/namespaceConnectionEvents');

const userRoutes = require('./routes/userRoutes');

/* MIDDLEWARES */
const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, auth-token'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });

const connection = mongoose.connection;
connection.on('error', error => {
  console.log('Connection error' + error);
});

/* Database connection */
connection.once('open', async () => {
  const server = app.listen(9000);
  const io = socket.init(server);

  /* Socket with token authentication */
  io.use((socket, next) => {
    socketAuthentication(socket, next);
  }).on('connection', async socket => {
    console.log(socket.decoded);
    await mainConnectionEvents(socket);
  });

  const namespaceEventEmitter = Namespace.watch();

  namespaceEventEmitter.on('change', async change => {
    if (change.operationType === 'insert') {
      namespaceModule.namespaces = change.fullDocument;
    }
  });

  /*
   * it creates namespace array listener
   * whenever we set namespaceModule.namespace - callback
   * will be executed
   */
  namespaceModule.subscribe(value => {
    value.map(namespace => {
      io.of(`/${namespace._id}`)
        .use((namespaceSocket, next) => {
          socketAuthentication(namespaceSocket, next);
        })
        .on('connection', async namespaceSocket => {
          await namespaceConnectionEvent(namespaceSocket, namespace);
        });
    });
  });

  namespaceModule.namespaces = await namespaceController.getAllNamespaces();

  app.use('/user', userRoutes);
});
