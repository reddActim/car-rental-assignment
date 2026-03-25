const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.split(' ')[1];
  console.log("JWT_SECRET in env:", process.env.JWT_SECRET);

  try {
    const decoded = jwt.verify(token, 'supersecretkey'); 
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
