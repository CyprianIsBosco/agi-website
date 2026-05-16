const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    fname:   { type: String, required: true },
    lname:   { type: String },
    email:   { type: String, required: true },
    phone:   { type: String },
    subject: { type: String },
    message: { type: String, required: true },
    read:    { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Contact', contactSchema);
