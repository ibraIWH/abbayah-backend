const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// GET — public. Storefront reads hero + news + payment numbers. Auto-creates defaults on first call.
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT — admin only. Accepts a partial body: { hero: {...} } and/or { newsText, newsActive }
// and/or { promo: {...} } and/or { payment: {...} }.
router.put('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();

    // Merge hero fields so updating just the title doesn't wipe the image, etc.
    if (req.body.hero) {
      settings.hero = { ...settings.hero.toObject(), ...req.body.hero };
    }
    if (typeof req.body.newsText === 'string') settings.newsText = req.body.newsText;
    if (typeof req.body.newsActive === 'boolean') settings.newsActive = req.body.newsActive;

    // Merge promo fields so a partial update doesn't wipe the rest
    if (req.body.promo) {
      settings.promo = { ...settings.promo.toObject(), ...req.body.promo };
    }

    // Merge payment (Zaad / eDahab numbers) the same way.
    // `settings.payment` can be undefined on docs created before this field existed, so guard it.
    if (req.body.payment) {
      const current = settings.payment ? settings.payment.toObject() : {};
      settings.payment = { ...current, ...req.body.payment };
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;