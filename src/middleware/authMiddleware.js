const jwt = require('jsonwebtoken');

// Middleware: protect user routes
const ensureAuthenticated = (req, res, next) => {
  const token = req.cookies.gb_token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware: protect admin routes
const ensureAdmin = (req, res, next) => {
  const token = req.cookies.gb_token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin
};
