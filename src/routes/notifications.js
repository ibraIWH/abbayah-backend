const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { notifyUser } = require('../utils/notify');

// ------------------------------------------------------------
// GET /api/notifications — the signed-in user's notifications
// ------------------------------------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const items = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    const unread = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ items, unread });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------------------------------------------------
// PUT /api/notifications/read-all — mark all as read
// ------------------------------------------------------------
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ message: 'All marked read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// PUT /api/notifications/:id/read — mark one as read
// ------------------------------------------------------------
router.put('/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json(n);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// POST /api/notifications/broadcast — admin sends a promo to ALL users
// Body: { title, message, link? }
// ------------------------------------------------------------
router.post('/broadcast', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { title, message, link = '' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    // One notification per user. Fine for a small shop; for scale you'd
    // batch this, but this keeps each user's list self-contained.
    const users = await User.find({}, '_id');
    const docs = users.map(u => ({
      user: u._id, type: 'promo', title, message, link,
    }));
    await Notification.insertMany(docs);

    res.status(201).json({ message: `Sent to ${docs.length} users` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;