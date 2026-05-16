/**
 * Simple admin key middleware.
 * Expects the request to carry:
 *   Header:  x-admin-key: <key>
 *   OR query: ?adminKey=<key>
 */
module.exports = function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid admin key' });
  }
  next();
};
