const express = require('express');
const { createPurchase } = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, createPurchase);

module.exports = router;