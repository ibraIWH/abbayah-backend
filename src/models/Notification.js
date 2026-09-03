const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Who receives it
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // 'order'  → order status updates (auto-created)
    // 'promo'  → announcements the admin sends
    type: { type: String, enum: ['order', 'promo'], default: 'promo' },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // Optional deep-link target, e.g. an order id or a category
    link:    { type: String, default: '' },

    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Newest first, scoped per user — the query the app runs constantly
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);