const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Build a clean cart line from the database — never trust client prices
const buildItem = (product, size, quantity) => ({
  product: product._id,
  name: product.name,
  price: product.salePrice ?? product.price,
  imageUrl: product.imageUrl,
  size: size || 'M',
  quantity: Math.max(1, quantity || 1),
});

// GET /api/cart — return the user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/cart/sync — replace the whole cart in one call.
// Body: { items: [{ productId, quantity, size }] }
// Declared BEFORE /:itemId so Express doesn't read "sync" as an item id.
// Used by the mobile app, which keeps the cart in memory and pushes full state.
router.put('/sync', auth, async (req, res) => {
  try {
    const { items = [] } = req.body;

    const rebuilt = [];
    for (const line of items) {
      const product = await Product.findById(line.productId);
      if (!product) continue; // silently drop products that no longer exist
      rebuilt.push(buildItem(product, line.size, line.quantity));
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    cart.items = rebuilt;
    await cart.save();

    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/cart — add an item (or increase quantity)
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, size = 'M' } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    const existing = cart.items.find(
      item => item.product.toString() === productId && item.size === size
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push(buildItem(product, size, quantity));
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/cart/item — update quantity for one line (or remove if 0).
// Body: { productId, size, quantity }
// Identified by productId + size because cartItemSchema is { _id: false }.
router.put('/item', auth, async (req, res) => {
  try {
    const { productId, size = 'M', quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const index = cart.items.findIndex(
      item => item.product.toString() === productId && item.size === size
    );
    if (index === -1) return res.status(404).json({ message: 'Item not found' });

    if (quantity <= 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = quantity;
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/cart — clear entire cart
router.delete('/', auth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;