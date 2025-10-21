
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

// Get user's cart
router.get('/', auth, cartController.getCart);

// Add item to cart
router.post('/add', auth, cartController.addToCart);


// Update cart item quantity
router.put('/update/:itemId', auth, cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:itemId', auth, cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', auth, cartController.clearCart);

module.exports = router;
