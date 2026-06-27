const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true }, // the lock that enforces "only one"

    hero: {
      eyebrow:  { type: String, default: 'NEW COLLECTION · SPRING 2026' },
      title:    { type: String, default: 'abyr' },
      subtitle: { type: String, default: 'Handcrafted abayas designed for the modern woman. Free delivery over SAR 200.' },
      imageUrl: { type: String, default: '' },
      ctaText:  { type: String, default: 'SHOP NOW' },
      ctaLink:  { type: String, default: '/category/all' },
    },

    newsText:   { type: String, default: 'FREE DELIVERY OVER SAR 200 · NEW COLLECTION · EASY RETURNS' },
    newsActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Always hand back the one doc — create it with defaults the very first time it's asked for.
siteSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ key: 'site' });
  if (!doc) doc = await this.create({ key: 'site' });
  return doc;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);