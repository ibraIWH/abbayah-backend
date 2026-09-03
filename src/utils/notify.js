const Notification = require('../models/Notification');

// Create one notification for one user. Fire-and-forget friendly:
// callers can await it or not; failures are logged, never thrown up.
async function notifyUser({ user, type = 'promo', title, message, link = '' }) {
  try {
    return await Notification.create({ user, type, title, message, link });
  } catch (err) {
    console.error('notifyUser failed:', err.message);
    return null;
  }
}

// Friendly copy for each order status
function orderStatusMessage(orderNumber, status) {
  switch (status) {
    case 'confirmed':
      return { title: 'Order confirmed', message: `Your order ${orderNumber} has been confirmed and is being prepared.` };
    case 'shipped':
      return { title: 'Order shipped', message: `Good news — your order ${orderNumber} is on its way.` };
    case 'delivered':
      return { title: 'Order delivered', message: `Your order ${orderNumber} has been delivered. We hope you love it.` };
    case 'cancelled':
      return { title: 'Order cancelled', message: `Your order ${orderNumber} has been cancelled. Contact us if you have questions.` };
    default:
      return { title: 'Order update', message: `Your order ${orderNumber} status is now ${status}.` };
  }
}

module.exports = { notifyUser, orderStatusMessage };