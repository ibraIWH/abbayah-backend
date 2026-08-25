const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const productRouter = require('./src/routes/products.js');
const categoriesRouter = require('./src/routes/categories');

const app = express();

app.use(cors());
app.use(express.json());

// HEALTH CHECK
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'hni-backend', version: '1.0.0' });
});

// Routes
app.use('/api/products', productRouter);
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/favourites', require('./src/routes/favourites'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/offers', require('./src/routes/offers'));
app.use('/api/settings', require('./src/routes/settings'));

// Categories — the same router mounted twice.
// /api/categories is the real name; /api/collections stays as a legacy alias
// so the admin and any older clients keep working until they're updated.
app.use('/api/categories', categoriesRouter);
app.use('/api/collections', categoriesRouter);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`API running on :${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });