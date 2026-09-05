const mongoose = require('mongoose');

// A record of one promo the admin sent to all customers.
// The per-user Notification docs are the actual inbox items; this is the
// admin-facing history so they can review, resend, or delete a campaign.
const broadcastSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    link:       { type: String, default: '' },
    sentCount:  { type: Number, default: 0 },  // how many users got it last send
    sendCount:  { type: Number, default: 1 },  // how many times it's been sent
  },
  { timestamps: true }
);

module.exports = mongoose.model('Broadcast', broadcastSchema);