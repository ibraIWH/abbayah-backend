const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },   // snapshot at purchase time
  price:    { type: Number, required: true },   // price actually paid
  imageUrl: { type: String, default: '' },
  size:     { type: String, default: 'M' },
  color:    { type: String, default: null },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:       { type: [orderItemSchema], required: true },

  shippingAddress: {
    name:  { type: String, required: true },
    line1: { type: String, required: true },
    city:  { type: String, required: true },
    phone: { type: String, default: '' },
  },

  subtotal:    { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  total:       { type: Number, required: true },

  status: {
    type: String,
    enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed',
  },
  paymentMethod: { type: String, default: 'cod' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);