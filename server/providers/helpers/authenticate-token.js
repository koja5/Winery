const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token nije prosleđen.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: 'Token nije validan.' });
    }
    req.user = payload;
    next();
  });
};
