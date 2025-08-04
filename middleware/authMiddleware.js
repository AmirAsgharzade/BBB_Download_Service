require('dotenv').config()
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

function authenticateJWT(req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' ,type:"auth"});
  }
}

module.exports = authenticateJWT;
