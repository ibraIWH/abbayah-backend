const mongoose = require('mongoose');

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
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);