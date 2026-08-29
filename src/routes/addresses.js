const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Every route here is for the signed-in customer's own address book,
// so `auth` runs on all of them and we always work from req.user.id.
// There is no admin listing — one customer never sees another's addresses.

// Only one address can be the default at a time.
const applyDefault = (user, id) => {
  user.addresses.forEach((a) => {
    a.isDefault = String(a._id) === String(id);
  });
};

// GET /api/addresses — the current user's saved addresses
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/addresses — add one
router.post('/', auth, async (req, res) => {
  try {
    const { name, line1, city, phone, isDefault } = req.body;
    if (!name || !line1 || !city) {
      return res.status(400).json({ message: 'Name, address and city are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.addresses.push({ name, line1, city, phone: phone || '' });
    const added = user.addresses[user.addresses.length - 1];

    // First address saved becomes the default automatically.
    if (isDefault || user.addresses.length === 1) applyDefault(user, added._id);

    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/addresses/:id — edit one
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const { name, line1, city, phone, isDefault } = req.body;
    if (name !== undefined) address.name = name;
    if (line1 !== undefined) address.line1 = line1;
    if (city !== undefined) address.city = city;
    if (phone !== undefined) address.phone = phone;
    if (isDefault) applyDefault(user, address._id);

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/addresses/:id — remove one
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If we removed the default, promote whatever is left.
    if (wasDefault && user.addresses.length > 0) {
      applyDefault(user, user.addresses[0]._id);
    }

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;