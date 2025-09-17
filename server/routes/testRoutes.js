// Simple test endpoint for order creation
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/test-order', authMiddleware, async (req, res) => {
  try {
    console.log('=== TEST ORDER CREATION ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    // Find first available product
    const product = await Product.findOne();
    if (!product) {
      return res.status(400).json({ error: 'No products available for testing' });
    }

    // Create minimal test order
    const testOrder = new Order({
      orderId: 'TEST-' + Date.now(),
      buyerId: req.user.id,
      items: [{
        productId: product._id,
        farmerId: product.farmerId,
        productName: product.name,
        quantity: 1,
        pricePerUnit: product.price,
        totalPrice: product.price,
        unit: product.unit
      }],
      totalAmount: product.price,
      finalAmount: product.price,
      paymentMethod: 'cash',
      status: 'pending',
      deliveryInfo: {
        type: 'delivery',
        address: {
          street: req.body.deliveryAddress || 'Test Address'
        },
        instructions: req.body.specialInstructions || 'Test instructions'
      }
    });

    console.log('Attempting to save test order...');
    await testOrder.save();
    console.log('✅ Test order saved successfully!');

    res.json({
      success: true,
      message: 'Test order created successfully',
      orderId: testOrder.orderId,
      orderData: testOrder
    });

  } catch (error) {
    console.error('❌ Test order creation failed:', error);
    res.status(500).json({
      error: 'Test order creation failed',
      details: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;