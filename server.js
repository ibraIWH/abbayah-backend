const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const productRouter = require('./src/routes/products');


const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRouter);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
