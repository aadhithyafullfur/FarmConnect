const express = require('express');
const { 
  register, 
  login, 
  verifyToken,
  getProfile, 
  updateProfile, 
  changePassword, 
  updateSettings, 
  deactivateAccount 
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Test routes (no auth needed for testing)
router.get('/test-delete', (req, res) => {
  console.log('Test route hit!');
  res.json({ msg: 'Delete route is accessible', method: 'GET' });
});

router.delete('/test-delete', (req, res) => {
  console.log('DELETE test route hit!');
  res.json({ msg: 'DELETE method is working', method: 'DELETE' });
});

// Protected routes
router.get('/verify', authMiddleware, verifyToken);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.put('/settings', authMiddleware, updateSettings);

// Account deletion route  
router.delete('/account', authMiddleware, deactivateAccount);

module.exports = router;