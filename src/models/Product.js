const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    salePrice:   { type: Number, default: null, min: 0 },
    imageUrl:    { type: String, default: '' },
    imageUrl2:   { type: String, default: '' },   // hover image on web
    images:      [{ type: String }],              // gallery on product page
    category:    { type: String, default: 'Abaya', trim: true },
    description: { type: String, default: '' },
    stock:       { type: Number, default: 10, min: 0 },
    sizes:       { type: [String], default: ['XS', 'S', 'M', 'L', 'XL'] },
    colors: [
      {
        name:     { type: String },
        hex:      { type: String },
        imageUrl: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);