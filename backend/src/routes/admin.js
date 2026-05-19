const router    = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const Order     = require('../models/Order');
const Contact   = require('../models/Contact');

// All routes below require a valid admin key
router.use(adminAuth);

// ── GET /api/admin/orders — list all orders (newest first) ───────────────────
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json(orders);
  } catch (err) {
    console.error('[admin] GET orders:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/admin/orders/:id/status — update order status ─────────────────
router.patch('/orders/:id/status', async (req, res) => {
  const VALID = ['pending','in_progress','delivered','completed','failed'];
  const { status } = req.body;

  if (!VALID.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ ok: true, status: order.status });
  } catch (err) {
    console.error('[admin] PATCH status:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/admin/orders/:id — delete an order ───────────────────────────
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/contacts — list all contact messages ─────────────────────
router.get('/contacts', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).lean();
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/admin/contacts/:id/read ───────────────────────────────────────
router.patch('/contacts/:id/read', async (req, res) => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/stats — quick summary numbers ─────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, pending, in_progress, delivered, completed, failed, contacts] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'in_progress' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'failed' }),
      Contact.countDocuments({ read: false }),
    ]);
    return res.json({ total, pending, in_progress, delivered, completed, failed, unreadContacts: contacts });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});


// ── GET /api/admin/users — list all registered users ─────────────────────────
router.get('/users', async (req, res) => {
  try {
    const User  = require('../models/User');
    const users = await User.find().select('-password -resetOTP -resetOTPExpires').sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/admin/users/:id/toggle — enable/disable account ───────────────
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.active = !user.active;
    await user.save();
    return res.json({ ok: true, active: user.active });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
