const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// ------------------------------------------------------------
// GET /api/cart — return the user's cart
// ------------------------------------------------------------
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      // If no cart exists yet, return empty structure
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// POST /api/cart — add an item (or increase quantity)
// Body: { productId, quantity?, size? }
// ------------------------------------------------------------
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, size = 'M' } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      // Create new cart
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if the same product+size already exists
    const existing = cart.items.find(
      item => item.product.toString() === productId && item.size === size
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.salePrice ?? product.price,
        imageUrl: product.imageUrl,
        size,
        quantity,
      });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------------------------------------------------
// PUT /api/cart/:itemId — update quantity (or remove if 0)
// Body: { quantity }
// ------------------------------------------------------------
router.put('/:itemId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (quantity <= 0) {
      cart.items.pull({ _id: req.params.itemId });
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// DELETE /api/cart/:itemId — remove item
// ------------------------------------------------------------
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items.pull({ _id: req.params.itemId });
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// DELETE /api/cart — clear entire cart
// ------------------------------------------------------------
router.delete('/', auth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;