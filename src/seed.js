const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/products');

const sampleProducts = [
  {
    name: "Classic Black Abbayah",
    price: 249,
    imageUrl: "https://i.imgur.com/1.jpg",
    category: "Classic"
  },
  {
    name: "Beige Open Abbayah",
    price: 299,
    imageUrl: "https://i.imgur.com/2.jpg",
    category: "Open"
  },
  {
    name: "Embroidered Occasion Abbayah",
    price: 399,
    imageUrl: "https://i.imgur.com/3.jpg",
    category: "Occasion"
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await Product.deleteMany();
    console.log("Old products removed");

    await Product.insertMany(sampleProducts);
    console.log("New sample products added");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDB();
