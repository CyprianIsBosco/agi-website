const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB not connected:', err.message));

const Order = mongoose.model('Order', new mongoose.Schema({
  name: String, email: String, company: String,
  phone: String, industry: String, brief: String,
  package: String, amount: Number,
  status: { type: String, default: 'pending', enum: ['pending','paid','in_progress','delivered','completed'] },
  createdAt: { type: Date, default: Date.now }
}));

const PRICES = { starter: 150, business: 400, enterprise: 1200 };

app.get('/', (req, res) => res.json({ status: 'AGI Backend running' }));

app.post('/api/orders', async (req, res) => {
  try {
    const { name, email, company, phone, industry, brief, package: pkg } = req.body;
    if (!name || !email || !company || !pkg) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const order = await Order.create({
      name, email, company, phone, industry, brief,
      package: pkg, amount: PRICES[pkg] || 0
    });
    console.log('New order: ' + name + ' - ' + pkg);
    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  if (req.headers['x-admin-key'] !== (process.env.ADMIN_KEY || 'agi-admin-2025')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

app.patch('/api/admin/orders/:id/status', async (req, res) => {
  if (req.headers['x-admin-key'] !== (process.env.ADMIN_KEY || 'agi-admin-2025')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  try {
    const { status } = req.body;
    const allowed = ['pending','paid','in_progress','delivered','completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    console.log('Order ' + req.params.id + ' updated to: ' + status);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: 'Invalid order ID' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch {
    res.status(400).json({ error: 'Invalid order ID' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('AGI Backend running on http://localhost:' + PORT));
