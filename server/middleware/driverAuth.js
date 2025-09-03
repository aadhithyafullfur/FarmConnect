const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

const driverAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is a driver token
    if (decoded.type !== 'driver') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token type.'
      });
    }

    const driver = await Driver.findById(decoded.id).select('-password');
    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Driver not found.'
      });
    }

    req.driver = driver;
    next();
  } catch (error) {
    console.error('Driver auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token.'
    });
  }
};

module.exports = driverAuth;
