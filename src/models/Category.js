const mongoose = require('mongoose');

// tiny slug maker: "Eid Edit" -> "eid-edit" (no extra npm package needed)
const slugify = (str = '') =>
  str.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')   // anything not a letter/number -> hyphen
    .replace(/^-+|-+$/g, '');      // trim hyphens off the ends

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, trim: true, lowercase: true, index: true },
    imageUrl:    { type: String, default: '' },
    description: { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },   // lower number shows first
  },
  { timestamps: true }   // adds createdAt + updatedAt for you
);

// Before saving a NEW doc, build the slug from the name if none was given.
categorySchema.pre('save', function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

// findByIdAndUpdate skips the 'save' hook, so keep the slug in sync here too.
categorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  if (update.name && !update.slug) update.slug = slugify(update.name);
  next();
});

// The third argument is the important one. Normally Mongoose turns the model
// name into the MongoDB collection name ('Category' -> 'categories'), which
// would point at an empty collection and your 13 records would vanish from the
// app. Pinning it to 'collections' keeps reading and writing the exact same
// data you already have — the code gets a new name, the database doesn't move.
module.exports = mongoose.model('Category', categorySchema, 'collections');