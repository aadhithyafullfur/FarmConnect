const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// Create new order
router.post('/', auth, orderController.createOrder);

// Get buyer's orders
router.get('/buyer', auth, orderController.getBuyerOrders);

// Get farmer's orders
router.get('/farmer', auth, orderController.getFarmerOrders);

// Get order by ID
router.get('/:orderId', auth, orderController.getOrderById);

// Update order status (farmer only)
router.patch('/:orderId/status', auth, orderController.updateOrderStatus);

// Cancel order (buyer only)
router.patch('/:orderId/cancel', auth, orderController.cancelOrder);

module.exports = router;
