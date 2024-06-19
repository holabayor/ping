const express = require('express');
const session = require('express-session');
const { createServer } = require('http');
const { join } = require('path');
const { Sequelize } = require('sequelize');
const { Server } = require('socket.io');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const Chatbot = require('./chatbot');
const User = require('./user');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve the static files
app.use(express.static(join(__dirname, 'public')));

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

const sessionStore = new SequelizeStore({
  db: sequelize,
});

const sessionMiddleware = session({
  secret: 'a new secret',
  store: new SequelizeStore({
    db: sequelize,
  }),
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
});

app.use(sessionMiddleware);

sessionStore.sync();

io.engine.use(sessionMiddleware);

const chatbot = new Chatbot(io);

io.on('connection', (socket) => {
  const reqSession = socket.request.session;
  const sessionId = reqSession.id;
  socket.join(sessionId);

  socket.on('username', (username) => {
    // console.log('User input on the server: ' + username);

    if (!reqSession.users) {
      reqSession.users = {};
    }

    const userId = User.generateKey(username, sessionId);
    let user;

    if (!reqSession.users[userId]) {
      user = new User(username, sessionId);
      reqSession.users[userId] = user;
      chatbot.sendMessage(user, `Welcome ${username}!`);
    } else {
      user = User.getUser(reqSession.user);
      chatbot.sendMessage(
        reqSession.users[userId],
        `Welcome back ${username}!`
      );
    }
    reqSession.user = user;
    chatbot.sendMessage(user, chatbot.initialMessage);
  });

  reqSession.save();

  socket.on('userInput', (input) => {
    // console.log('User input on the server: ' + input);
    // console.log('The connected user session is ', reqSession.users);
    if (reqSession.user) {
      chatbot.handleUserInput(reqSession, input);
    } else {
      socket.emit('error', 'Session not found');
    }

    reqSession.save();
  });
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
