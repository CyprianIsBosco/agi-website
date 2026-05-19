const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAuth(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'Not authenticated — please log in' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(payload.id).select('-password -resetOTP -resetOTPExpires');

    if (!user)        return res.status(401).json({ error: 'User not found' });
    if (!user.active) return res.status(403).json({ error: 'Account is disabled' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token — please log in again' });
  }
};
