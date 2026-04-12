const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB not connected:', err.message));

// ─── ORDER MODEL ─────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  // Client details
  name:      { type: String, required: true },
  email:     { type: String },
  company:   { type: String, required: true },
  phone:     { type: String, required: true },
  location:  { type: String },

  // Service — only 4 allowed
  package: {
    type: String,
    required: true,
    enum: [
      'Printing, Branding & Imaging',
      'Stationery Supplies',
      'IT Installations & Client Management',
      'Graphic Design & Advertisement'
    ]
  },

  // Order details
  brief:    { type: String },
  amount:   { type: Number, default: 0 },

  // Payment
  paymentOption: {
    type: String,
    enum: ['pay_now', 'pay_later'],
    default: 'pay_later'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  mpesaPhone:     { type: String },
  transactionId:  { type: String },

  // Order status
  status: {
    type: String,
    enum: ['pending', 'paid', 'in_progress', 'delivered', 'completed', 'failed'],
    default: 'pending'
  },

  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// ─── SERVICE PRICES ───────────────────────────────────────────
const PRICES = {
  'Printing, Branding & Imaging': 150,
  'Stationery Supplies': 80,
  'IT Installations & Client Management': 200,
  'Graphic Design & Advertisement': 100
};

// ─── ADMIN KEY ────────────────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY || 'agi-admin-2025';

// ─── ROUTES ───────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => res.json({
  status: 'AGI Backend running',
  version: '2.0',
  services: Object.keys(PRICES)
}));

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      name, email, company, phone, location,
      package: pkg, brief, paymentOption, mpesaPhone
    } = req.body;

    if (!name || !phone || !company || !pkg) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, company, package' });
    }

    // Validate service
    const validServices = Object.keys(PRICES);
    if (!validServices.includes(pkg)) {
      return res.status(400).json({
        error: 'Invalid service. Must be one of: ' + validServices.join(', ')
      });
    }

    const order = await Order.create({
      name, email, company, phone, location,
      package: pkg,
      brief,
      amount: PRICES[pkg] || 0,
      paymentOption: paymentOption || 'pay_later',
      mpesaPhone: mpesaPhone || phone,
      paymentStatus: 'pending',
      status: 'pending'
    });

    console.log(`📦 New order: ${name} — ${pkg} — ${paymentOption || 'pay_later'}`);
    res.json({ success: true, orderId: order._id, message: 'Order received successfully' });

  } catch (err) {
    console.error('Order error:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// Get all orders (admin)
app.get('/api/admin/orders', async (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (admin)
app.patch('/api/admin/orders/:id/status', async (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  try {
    const { status, paymentStatus } = req.body;
    const allowed = ['pending','paid','in_progress','delivered','completed','failed'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    console.log(`✅ Order ${req.params.id} updated: ${JSON.stringify(update)}`);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: 'Invalid order ID' });
  }
});

// Get single order
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch {
    res.status(400).json({ error: 'Invalid order ID' });
  }
});

// Analytics summary (admin)
app.get('/api/admin/analytics', async (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  try {
    const orders = await Order.find();
    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'completed').reduce((s, o) => s + (o.amount || 0), 0);
    const byService = {};
    orders.forEach(o => { byService[o.package] = (byService[o.package] || 0) + 1; });
    const byStatus = {};
    orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
    const byPayment = { pay_now: 0, pay_later: 0 };
    orders.forEach(o => { if (o.paymentOption) byPayment[o.paymentOption]++; });
    res.json({
      total: orders.length,
      totalRevenue,
      byService,
      byStatus,
      byPayment,
      recentOrders: orders.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics error' });
  }
});

// ─── PLACEHOLDER: M-Pesa STK Push ────────────────────────────
// Will be implemented once Daraja API credentials are ready
app.post('/api/mpesa/stk-push', async (req, res) => {
  res.json({
    success: false,
    message: 'M-Pesa integration coming soon. Please use Pay on Delivery for now.',
    status: 'not_configured'
  });
});

app.post('/api/mpesa/callback', (req, res) => {
  console.log('M-Pesa callback received:', req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ─── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 AGI Backend v2.0 running on http://localhost:${PORT}`));
