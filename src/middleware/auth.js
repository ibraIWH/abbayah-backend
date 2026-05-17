// POST /api/auth/verify-sms
router.post('/verify-sms', require('../middleware/auth'), async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const check = await client.verify.v2
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