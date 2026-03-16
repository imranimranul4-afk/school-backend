const jwt = require('jsonwebtoken');

// Verify JWT and attach user info to req
const protect = (roles = []) => {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Not authenticated. Please login.' });
      }
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role, username }

      // Role check
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
    }
  };
};

// Helper to sign a JWT token
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { protect, signToken };
