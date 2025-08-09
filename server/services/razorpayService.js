const Razorpay = require('razorpay');
const crypto = require('crypto');

let instance = null;

function getInstance() {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

async function createOrder(amountInPaise, currency = 'INR', receipt = '') {
  const rzp = getInstance();
  const order = await rzp.orders.create({ amount: amountInPaise, currency, receipt });
  return order;
}

function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(`${orderId}|${paymentId}`);
  const expectedSignature = shasum.digest('hex');
  return expectedSignature === signature;
}

module.exports = { createOrder, verifySignature };
