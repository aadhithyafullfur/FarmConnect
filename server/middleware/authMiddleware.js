const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('🔐 Auth middleware triggered for:', req.method, req.url);
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('🔑 Token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  
  if (!token) {
    console.log('❌ Auth failed: No token provided');
    return res.status(401).json({ msg: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified successfully for user:', decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Auth failed: Invalid token -', err.message);
    res.status(401).json({ msg: 'Invalid token' });
  }
};