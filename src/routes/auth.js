const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/mailer');
const { sendVerificationSMS } = require('../utils/sms');

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ------------------------------------------------------------
// POST /api/auth/register
// ------------------------------------------------------------
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password, phone } = req.body;

      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash, phone: phone || null });

      // Generate email verification token
      const token = crypto.randomBytes(32).toString('hex');
      user.emailToken = token;
      user.emailTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();

      // Fire and forget – send verification email in background
      sendVerificationEmail(email, token)
        .then(() => console.log('Verification email sent to ' + email))
        .catch(err => console.error('Failed to send verification email:', err.message));

      // Generate JWT so user can log in immediately
      const jwtToken = generateToken(user);

      res.status(201).json({
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ------------------------------------------------------------
// POST /api/auth/login
// ------------------------------------------------------------
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ message: 'Invalid email or password' });

      const token = generateToken(user);
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ------------------------------------------------------------
// GET /api/auth/me  (protected)
// ------------------------------------------------------------
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// POST /api/auth/verify-email/:token
// ------------------------------------------------------------
router.post('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      emailToken: req.params.token,
      emailTokenExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.emailVerified = true;
    user.emailToken = undefined;
    user.emailTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// POST /api/auth/resend-email-verification
// ------------------------------------------------------------
router.post('/resend-email-verification', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });

    const token = crypto.randomBytes(32).toString('hex');
    user.emailToken = token;
    user.emailTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, token);
    res.json({ message: 'Verification email resent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// POST /api/auth/send-sms  (Twilio Verify)
// ------------------------------------------------------------
router.post('/send-sms', require('../middleware/auth'), async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Save phone number (Twilio Verify will send the code)
    user.phone = phone;
    await user.save();

    await sendVerificationSMS(phone);

    res.json({ message: 'SMS sent' });
  } catch (err) {
    console.error('SMS send error:', err);
    res.status(500).json({ message: 'Failed to send SMS', error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/auth/verify-sms  (Twilio Verify)
// ------------------------------------------------------------
router.post('/verify-sms', require('../middleware/auth'), async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Use Twilio Verify to check the code
    const twilio = require('twilio');
    const verifyClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const check = await verifyClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: user.phone, code });

    if (check.status === 'approved') {
      user.phoneVerified = true;
      await user.save();
      res.json({ message: 'Phone verified successfully' });
    } else {
      res.status(400).json({ message: 'Invalid or expired code' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

module.exports = router;