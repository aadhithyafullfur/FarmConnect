const express = require('express');
const {
  createProduct,
  getProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadImage,
  getFarmerAnalytics
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Protected routes (require authentication) - Place specific routes BEFORE dynamic routes
router.post('/', authMiddleware, uploadImage, createProduct);
router.put('/:id', authMiddleware, uploadImage, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);
router.get('/my/products', authMiddleware, getMyProducts);
router.get('/my-products', authMiddleware, getMyProducts);
router.get('/analytics', authMiddleware, getFarmerAnalytics);

// Public routes - Dynamic routes LAST
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;