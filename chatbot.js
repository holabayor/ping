const User = require('./user');

class Chatbot {
  constructor(io) {
    this.io = io;
    this.menu = [
      { name: 'Fried Rice', price: 2000 },
      { name: 'Jollof Rice', price: 1500 },
      { name: 'Beef', price: 1200 },
      { name: 'Chicken', price: 3000 },
      { name: 'Pasta', price: 2500 },
      { name: 'Burger', price: 1800 },
      { name: 'Pizza', price: 3000 },
      { name: 'Salad', price: 1000 },
      { name: 'Ice Cream', price: 500 },
      { name: 'Cake', price: 1500 },
    ];
    this.initialMessage = `<b>Select an option:</b><br/>
                            1. Place an order<br/>
                            99. Checkout order<br/>
                            98. See order history<br/>
                            97. See current order<br/>
                            0. Cancel order`;
  }

  sendMessage(user, message) {
    this.io.to(user.sessionId).emit('message', message);
  }

  generateMenuList() {
    return this.menu
      .map((item, index) => `${index + 21}. ${item.name} - ${item.price}<br/>`)
      .join('');
  }

  handleUserInput(session, input) {
    const userKey = User.generateKey(session.user.username, session.id);
    const user = User.getUser(session.users[userKey]);

    switch (user.currentState) {
      case 'initial':
        this.handleInitialInput(user, input);
        break;
      case 'ordering':
        this.handleOrderingInput(user, input);
        break;
      default:
        this.sendMessage(user, 'An error has occured');
        user.currentState = 'initial';
        break;
    }

    // Sync and update the user and session objects
    user.saveUser();
    session.users[userKey] = user;
    session.save();
  }

  handleInitialInput(user, input) {
    switch (input) {
      case '1':
        const menuList = this.generateMenuList();
        this.sendMessage(user, `<b>Menu:</b><br/>${menuList}`);
        user.currentState = 'ordering';
        break;

      case '99':
        if (user.checkoutOrder()) {
          this.sendMessage(user, `Order placed successfully.`);
        } else {
          this.sendMessage(user, 'No order to place.');
        }
        break;

      case '98':
        this.sendMessage(user, `Order history:<br/>${user.getOrderHistory()}`);
        break;

      case '97':
        this.sendMessage(user, `Current order:<br/>${user.getCurrentOrder()}`);
        break;

      case '0':
        if (user.cancelOrder()) {
          this.sendMessage(user, 'Order canceled.');
        } else {
          this.sendMessage(user, 'No order to cancel.');
        }
        break;

      default:
        this.sendMessage(user, 'Invalid option selected');
        this.sendMessage(user, `${this.initialMessage}`);
        break;
    }
  }
  handleOrderingInput(user, input) {
    const menuIndex = parseInt(input) - 21;
    if (menuIndex >= 0 && menuIndex < this.menu.length) {
      user.addOrder(this.menu[menuIndex]);
      this.sendMessage(
        user,
        `${this.menu[menuIndex].name} added to your order.`
      );
      this.sendMessage(
        user,
        'Select <br/> 99 to checkout the order <br/>&nbsp;0 to cancel the order <br/> 00 to go to the main menu'
      );
    } else if (input === '99') {
      if (user.checkoutOrder()) {
        this.sendMessage(user, `Order placed successfully.`);
      } else {
        this.sendMessage(user, 'No order to place.');
      }
    } else if (input === '0') {
      if (user.cancelOrder) {
        this.sendMessage(user, 'Order canceled.');
      } else {
        this.sendMessage(user, 'No order to cancel.');
      }
    } else if (input === '00') {
      user.currentState = 'initial';
      this.sendMessage(user, `${this.initialMessage}`);
    } else {
      this.sendMessage(
        user,
        'Invalid option. Kindly select a valid option.<br/>Select 00 to go to the main menu'
      );
    }
  }
}

module.exports = Chatbot;
