const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Broadcast = require('../models/Broadcast');
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
// DELETE /api/notifications/clear — delete ALL of the signed-in user's notifications
// (declared before /:id so "clear" isn't read as an id)
// ------------------------------------------------------------
router.delete('/clear', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ message: 'Cleared' });
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
// Helper: deliver a promo to every user's inbox, return how many
// ------------------------------------------------------------
async function deliverToAll({ title, message, link, broadcastId }) {
  const users = await User.find({}, '_id');
  const docs = users.map(u => ({
    user: u._id, type: 'promo', title, message, link, broadcast: broadcastId,
  }));
  if (docs.length) await Notification.insertMany(docs);
  return docs.length;
}

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

    // Create the campaign first so we can tag each delivered notification with it
    const campaign = await Broadcast.create({ title, message, link, sentCount: 0, sendCount: 1 });
    const count = await deliverToAll({ title, message, link, broadcastId: campaign._id });
    campaign.sentCount = count;
    await campaign.save();

    res.status(201).json({ message: `Sent to ${count} users` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/notifications/broadcasts — admin: list all campaigns sent
// ------------------------------------------------------------
router.get('/broadcasts', auth, roleGuard('admin'), async (req, res) => {
  try {
    const list = await Broadcast.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/notifications/broadcasts/:id/resend — send an old campaign again
// ------------------------------------------------------------
router.post('/broadcasts/:id/resend', auth, roleGuard('admin'), async (req, res) => {
  try {
    const b = await Broadcast.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Not found' });

    const count = await deliverToAll({ title: b.title, message: b.message, link: b.link, broadcastId: b._id });
    b.sentCount = count;
    b.sendCount += 1;
    await b.save();

    res.json({ message: `Resent to ${count} users` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------------------------------------------------
// PUT /api/notifications/broadcasts/:id — edit a campaign AND update the
// copies already delivered to customers' inboxes
// Body: { title, message, link? }
// ------------------------------------------------------------
router.put('/broadcasts/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { title, message, link = '' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const b = await Broadcast.findByIdAndUpdate(
      req.params.id,
      { title, message, link },
      { new: true, runValidators: true }
    );
    if (!b) return res.status(404).json({ message: 'Not found' });

    // Update every delivered copy so customers see the new text
    await Notification.updateMany(
      { broadcast: req.params.id },
      { title, message, link }
    );

    res.json({ message: 'Campaign updated', broadcast: b });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------------------------------------------------
// DELETE /api/notifications/broadcasts/:id — remove a campaign from history
// AND recall it from every customer's inbox
// ------------------------------------------------------------
router.delete('/broadcasts/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    const deleted = await Broadcast.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });

    // Recall it from every customer's inbox too
    await Notification.deleteMany({ broadcast: req.params.id });

    res.json({ message: 'Campaign deleted and recalled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;