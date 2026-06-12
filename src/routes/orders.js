const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const generateOrderNumber = () => {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `ABR-${stamp}${rand}`;
};

// ------------------------------------------------------------
// POST /api/orders — create order (logged-in user)
// Body: { items: [{ productId, quantity, size, color }], shippingAddress, paymentMethod }
// ------------------------------------------------------------
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in order' });
    }
    if (!shippingAddress?.name || !shippingAddress?.line1 || !shippingAddress?.city) {
      return res.status(400).json({ message: 'Shipping address required' });
    }

    // Build items from the database — never trust client prices
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      const price = product.salePrice ?? product.price;
      const quantity = Math.max(1, item.quantity || 1);

      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        imageUrl: product.imageUrl,
        size: item.size || 'M',
        color: item.color || null,
        quantity,
      });

      subtotal += price * quantity;
    }

    const deliveryFee = subtotal >= 200 ? 0 : 25;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: paymentMethod || 'cod',
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/orders — my orders
// ------------------------------------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// GET /api/orders/:id — single order (owner or admin)
// ------------------------------------------------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// PUT /api/orders/:id/status — admin only
// Body: { status: "confirmed" | "shipped" | "delivered" | "cancelled" }
// ------------------------------------------------------------
router.put('/:id/status', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;