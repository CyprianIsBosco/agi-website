const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const Order   = require('../models/Order');
const requireAuth = require('../middleware/requireAuth');
const { sendOTPEmail, sendWelcomeEmail } = require('../authMailer');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES || '7d',
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fname, lname, email, phone, password } = req.body;

    if (!fname || !email || !password)
      return res.status(400).json({ error: 'First name, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

    const user  = await User.create({ fname, lname, email, phone, password });
    const token = sign(user._id);

    sendWelcomeEmail(user.email, user.fname).catch(e => console.error('[auth] welcome email:', e.message));

    return res.status(201).json({ ok: true, token, user: user.toProfile() });
  } catch (err) {
    console.error('[auth] register:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.active) return res.status(403).json({ error: 'Your account has been disabled. Contact us for help.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = sign(user._id);
    return res.json({ ok: true, token, user: user.toProfile() });
  } catch (err) {
    console.error('[auth] login:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/auth/me — get current user profile ───────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user.toProfile() });
});

// ── GET /api/auth/my-orders — get logged-in user's orders ────────────────────
router.get('/my-orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ email: req.user.email })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/auth/profile — update name/phone ───────────────────────────────
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { fname, lname, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fname, lname, phone },
      { new: true, runValidators: true }
    );
    return res.json({ ok: true, user: user.toProfile() });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/auth/change-password ──────────────────────────────────────────
router.patch('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Both fields are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user  = await User.findById(req.user._id);
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/forgot-password — send OTP ────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond OK to avoid revealing whether email exists
    if (!user) return res.json({ ok: true, message: 'If that email exists, a code has been sent.' });

    // Generate 6-digit OTP
    const otp     = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    user.resetOTP        = otp;
    user.resetOTPExpires = expires;
    await user.save({ validateBeforeSave: false });

    sendOTPEmail(user.email, user.fname, otp).catch(e => console.error('[auth] OTP email:', e.message));

    return res.json({ ok: true, message: 'If that email exists, a code has been sent.' });
  } catch (err) {
    console.error('[auth] forgot-password:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/reset-password — verify OTP + set new password ────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: 'Email, OTP and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await User.findOne({
      email:           email.toLowerCase(),
      resetOTP:        otp,
      resetOTPExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired code' });

    user.password        = newPassword;
    user.resetOTP        = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    return res.json({ ok: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('[auth] reset-password:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
