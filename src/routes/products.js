const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = {};

    // Category filter
    if (category && category !== "All") {
      filter.category = category;
    }

    // Search filter
    if (search) {
      filter.name = { $regex: search, $options: "i" }; // case-insensitive
    }

    const products = await Product.find(filter);
    res.json(products);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// CREATE a product
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
