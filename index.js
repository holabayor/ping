const express = require('express');
const { createServer, request } = require('http');
const { join, parse } = require('path');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);

const io = new Server(server);

// Serve the static files
app.use(express.static(join(__dirname, 'public')));

// Initialise an empty users object
const users = {};
// Will contain objects of user with key value pairs of { sessionId: {currentstate, currentOrder, History}}

// Menu list
const menu = [
  { name: 'Fried Rice', price: 2000 },
  { name: 'Jollof Rice', price: 1500 },
  { name: 'Beef', price: 1000 },
  { name: 'Chicken', price: 3000 },
];

// Initial message options
const initialMessage = `Select an option:\n
1. Place an order
99. Checkout order
98. See order history
97. See current order
0. Cancel order`;

// Message sending helper function
const sendMessage = (sessionId, message) => {
  io.to(sessionId).emit('message', message);
};

const handleUserInput = (sessionId, input) => {
  if (!users[sessionId]) {
    users[sessionId] = {
      currentOrder: [],
      orderHistory: [],
      currentState: 'initial',
    };
  }

  const user = users[sessionId];
  const currentOrder = user.currentOrder;

  switch (user.currentState) {
    case 'initial':
      switch (input) {
        case '1':
          user.currentState = 'ordering';
          let menuList = menu
            .map(
              (item, index) => `${index + 21}. ${item.name} - ${item.price}\n`
            )
            .join('');
          console.log(menuList);

          sendMessage(sessionId, menuList);
          break;
        case '99':
          if (currentOrder.length > 0) {
            user.orderHistory.push(...currentOrder);
            user.currentOrder = [];
            sendMessage(sessionId, `Order placed successfully.`);
          } else {
            sendMessage(sessionId, 'No order to place.');
          }
          break;
        case '98':
          sendMessage(
            sessionId,
            `Order history:\n${
              user.orderHistory.map((item) => item.name).join(', ') ||
              'No order history.'
            }`
          );

          break;
        case '97':
          sendMessage(
            sessionId,
            `Current order:\n${
              currentOrder.map((item) => item.name).join(', ') ||
              'No current order.'
            }`
          );

          break;
        case '0':
          user.currentOrder = [];
          sendMessage(sessionId, 'Order cancelled');
          break;
        default:
          sendMessage(sessionId, 'Invalid option selected');
      }
      break;

    case 'ordering':
      const menuIndex = parseInt(input) - 21;
      if (menuIndex >= 0 && menuIndex < menu.length) {
        currentOrder.push(menu[menuIndex]);
        // console.log(menu[menuIndex]);
        sendMessage(sessionId, `${menu[menuIndex].name} added to your order.`);
        sendMessage(sessionId, `Select 99 to place the order, 0 to cancel.`);
      } else if (input === '99') {
        if (currentOrder.length > 0) {
          user.orderHistory.push(...currentOrder);
          user.currentOrder = [];
          user.currentState = 'initial';
          sendMessage(sessionId, `Order placed successfully.`);
        } else {
          sendMessage(sessionId, 'No order to place.');
        }
      } else if (input === '0') {
        user.currentOrder = [];
        user.currentState = 'initial';
        sendMessage(sessionId, 'Order canceled.');
      } else {
        sendMessage(sessionId, 'Invalid option. Kindly select a valid option.');
      }
      break;

    default:
      //   console.log('This is correct ', user.currentState === 'initial');
      sendMessage(sessionId, `${sessionId} Wrong spot`);
      user.currentState = 'initial';
      break;
  }
};

io.on('connection', (socket) => {
  const sessionId = uuidv4();
  socket.join(sessionId);
  users[sessionId] = {
    currentOrder: [],
    orderHistory: [],
    currentState: 'initial',
  };

  // socket.emit('message', initialMessage);
  // sendMessage(sessionId, initialMessage);

  socket.on('userInput', (input) => {
    console.log('User input on the server: ' + input);
    // socket.emit('message', input);
    console.log(users[sessionId]);
    handleUserInput(sessionId, input);
  });
});

app.get('/', (req, res) => {
  //   res.send('Hello World');
  res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
