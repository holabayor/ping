const { v4: uuidv4 } = require('uuid');

class User {
  constructor(username, sessionId) {
    this.id = uuidv4();
    this.username = username;
    this.sessionId = sessionId;
    this.currentOrder = [];
    this.orderHistory = [];
    this.currentState = 'initial';
  }

  addOrder(item) {
    this.currentOrder.push(item);
  }

  checkoutOrder() {
    if (this.currentOrder.length > 0) {
      this.orderHistory.push(...this.currentOrder);
      this.currentOrder = [];
      this.currentState = 'initial';
      return true;
    } else {
      return false;
    }
  }

  cancelOrder() {
    if (this.currentOrder.length > 0) {
      this.currentOrder = [];
      this.currentState = 'initial';
      return true;
    } else {
      return false;
    }
  }

  getOrderHistory() {
    if (this.orderHistory.length > 0) {
      const history = this.orderHistory
        .map((item) => `${item.name} - ${item.price}`)
        .join('<br/>');
      const totalPrice = this.orderHistory.reduce(
        (total, item) => total + item.price,
        0
      );
      return `${history}<br/><b>Total: ${totalPrice}</b>`;
    } else {
      return 'No order history.';
    }
  }
  getCurrentOrder() {
    if (this.currentOrder.length > 0) {
      const order = this.currentOrder
        .map((item) => `${item.name} - ${item.price}`)
        .join('<br/>');
      const totalPrice = this.currentOrder.reduce(
        (total, item) => total + item.price,
        0
      );
      return `${order}<br/><b>Total: ${totalPrice}</b>`;
    } else {
      return 'No current order.';
    }
  }

  static getUser(sessionData) {
    const user = new User(sessionData.username, sessionData.sessionId);
    user.id = sessionData.id;
    user.currentOrder = sessionData.currentOrder;
    user.orderHistory = sessionData.orderHistory;
    user.currentState = sessionData.currentState;
    return user;
  }

  saveUser() {
    return {
      id: this.id,
      username: this.username,
      sessionId: this.sessionId,
      currentOrder: this.currentOrder,
      orderHistory: this.orderHistory,
      currentState: this.currentState,
    };
  }

  static generateKey(username, sessionId) {
    return `${username}-${sessionId}`;
  }
}

module.exports = User;
