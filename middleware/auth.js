// middleware/auth.js — JWT Authentication Middleware

const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  // Token comes from Authorization header as "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader; // also support raw token for backwards compat

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
