const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    badgeText: { type: String, default: '' },   // e.g. "30% OFF", "NEW"
    subtitle:  { type: String, default: '' },
    imageUrl:  { type: String, default: '' },
    link:      { type: String, default: '' },   // where the banner points
    isActive:  { type: Boolean, default: true },
    order:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);