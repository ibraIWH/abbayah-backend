const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// GET — public. Storefront reads hero + news. Auto-creates defaults on first call.
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT — admin only. Accepts a partial body: { hero: {...} } and/or { newsText, newsActive }.
router.put('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();

    // Merge hero fields so updating just the title doesn't wipe the image, etc.
    if (req.body.hero) {
      settings.hero = { ...settings.hero.toObject(), ...req.body.hero };
    }
    if (typeof req.body.newsText === 'string') settings.newsText = req.body.newsText;
    if (typeof req.body.newsActive === 'boolean') settings.newsActive = req.body.newsActive;

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;