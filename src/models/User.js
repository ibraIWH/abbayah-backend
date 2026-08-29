const mongoose = require('mongoose');

// A saved address in the customer's address book.
// Kept separate from Order.shippingAddress on purpose: an order must keep a
// frozen copy of where it actually shipped, even if the customer later edits
// or deletes the address here.
const addressSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  line1:     { type: String, required: true, trim: true },
  city:      { type: String, required: true, trim: true },
  phone:     { type: String, default: '', trim: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:     { type: String, required: true },
  role:             { type: String, enum: ['customer','admin'], default: 'customer' },

  // Email verification
  emailVerified:    { type: Boolean, default: false },
  emailToken:       { type: String, default: null },
  emailTokenExpiry: { type: Date, default: null },

  // SMS verification
  phone:            { type: String, default: null },
  phoneVerified:    { type: Boolean, default: false },
  smsCode:          { type: String, default: null },
  smsCodeExpiry:    { type: Date, default: null },

  // Saved delivery addresses — shared across web and iOS
  addresses:        { type: [addressSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);