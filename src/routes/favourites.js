const express = require('express');
const router = express.Router();
const Favourite = require('../models/Favourite');
const auth = require('../middleware/auth');

// GET /api/favourites — list user's favourite products
router.get('/', auth, async (req, res) => {
  try {
    const favourites = await Favourite.find({ user: req.user.id })
      .populate('product')
      .sort({ createdAt: -1 });
    res.json(favourites);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/favourites — add a product to favourites
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    const existing = await Favourite.findOne({ user: req.user.id, product: productId });
    if (existing) return res.status(409).json({ message: 'Already in favourites' });

    await Favourite.create({ user: req.user.id, product: productId });
    res.status(201).json({ message: 'Added to favourites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/favourites/:productId — remove from favourites
router.delete('/:productId', auth, async (req, res) => {
  try {
    const fav = await Favourite.findOneAndDelete({
      user: req.user.id,
      product: req.params.productId,
    });
    if (!fav) return res.status(404).json({ message: 'Favourite not found' });

    res.json({ message: 'Removed from favourites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;