const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fname:     { type: String, required: true, trim: true },
    lname:     { type: String, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:     { type: String, trim: true },
    password:  { type: String, required: true, minlength: 6 },

    // OTP for password reset
    resetOTP:        { type: String },
    resetOTPExpires: { type: Date },

    // Account status
    active:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Safe public profile (no password)
userSchema.methods.toProfile = function () {
  return {
    _id:    this._id,
    fname:  this.fname,
    lname:  this.lname,
    email:  this.email,
    phone:  this.phone,
    active: this.active,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
