const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Cloudinary reads these three from the environment (set them in Render).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Keep the file in memory — we stream it straight to Cloudinary, never to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// ------------------------------------------------------------
// POST /api/upload — admin uploads one image, gets back its URL
// Form field name: "image"
// ------------------------------------------------------------
router.post('/', auth, roleGuard('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Turn the in-memory buffer into a data URI Cloudinary accepts
    const b64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'abyr',                 // keeps the Cloudinary library tidy
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1600, crop: 'limit' }, // cap huge photos
        { quality: 'auto', fetch_format: 'auto' },     // smaller, faster loads
      ],
    });

    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// Multer throws for oversized/invalid files — turn that into a clean JSON error
router.use((err, req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
});

module.exports = router;