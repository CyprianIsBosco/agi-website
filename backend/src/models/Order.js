const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // Reference & meta
    ref:      { type: String, unique: true },
    status:   { type: String, enum: ['pending','in_progress','delivered','completed','failed'], default: 'pending' },

    // Step 1 — Service & location
    service:  { type: String, required: true },
    county:   { type: String, required: true },

    // Step 2 — Order details
    item:     { type: String },
    qty:      { type: String },
    deadline: { type: String },
    details:  { type: String },
    budget:   { type: String },

    // Step 3 — Client info
    fname:    { type: String, required: true },
    lname:    { type: String },
    org:      { type: String },
    email:    { type: String, required: true },
    phone:    { type: String },
    how:      { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Auto-generate ref if not provided
orderSchema.pre('save', function (next) {
  if (!this.ref) {
    this.ref = 'AGI-' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2,5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
