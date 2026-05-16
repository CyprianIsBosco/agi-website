const router  = require('express').Router();
const Order   = require('../models/Order');
const { sendOrderNotification, sendOrderConfirmation } = require('../mailer');

// ── POST /api/orders — submit a new order ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { service, county, fname, email } = req.body;

    if (!service || !county || !fname || !email) {
      return res.status(400).json({ error: 'service, county, fname, and email are required' });
    }

    const order = await Order.create(req.body);

    // Fire-and-forget emails — don't block the response
    sendOrderNotification(order).catch(err => console.error('[mailer] order notify:', err.message));
    sendOrderConfirmation(order).catch(err => console.error('[mailer] order confirm:', err.message));

    return res.status(201).json({ ok: true, ref: order.ref, _id: order._id });
  } catch (err) {
    console.error('[orders] POST error:', err.message);
    return res.status(500).json({ error: 'Server error — please try again.' });
  }
});

// ── GET /api/orders/:ref — client can look up their own order by ref ─────────
router.get('/:ref', async (req, res) => {
  try {
    const order = await Order.findOne({ ref: req.params.ref.toUpperCase() }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Return only safe fields to the client
    const { ref, service, county, item, qty, deadline, budget, fname, lname, status, createdAt } = order;
    return res.json({ ref, service, county, item, qty, deadline, budget, fname, lname, status, createdAt });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
