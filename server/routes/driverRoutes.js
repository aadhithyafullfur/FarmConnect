const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const {
  registerDriver,
  loginDriver,
  getDriverProfile,
  getAssignedOrders,
  updateOrderStatus,
  updateLocation,
  toggleAvailability,
  getDeliveryHistory,
  respondToOrder,
  getDriverEarnings
} = require('../controllers/driverController');

// Middleware to check if user is a driver
const checkDriverRole = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Driver role required.'
      });
    }
    
    // Get user data and add it to req.driver for compatibility
    const user = await User.findById(req.user.id).populate('driverProfile');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    req.driver = {
      id: user.driverProfile?._id || user._id,
      driverId: user.driverProfile?.driverId || user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      ...user.driverProfile
    };
    
    next();
  } catch (error) {
    console.error('Driver role check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.'
    });
  }
};

// Public routes
router.post('/register', registerDriver);
router.post('/login', loginDriver);

// Protected routes (require authentication and driver role)
router.use(authMiddleware);
router.use(checkDriverRole);

router.get('/profile', getDriverProfile);
router.get('/orders', getAssignedOrders);
router.get('/earnings', getDriverEarnings);
router.get('/history', getDeliveryHistory);
router.patch('/orders/:orderId/status', updateOrderStatus);
router.put('/orders/:orderId/status', updateOrderStatus);
router.put('/orders/:orderId/accept', respondToOrder);
router.patch('/orders/:orderId/respond', respondToOrder);
router.patch('/location', updateLocation);
router.patch('/availability', toggleAvailability);
router.put('/availability', toggleAvailability);

module.exports = router;
