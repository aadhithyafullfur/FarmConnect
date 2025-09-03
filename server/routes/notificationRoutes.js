const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Get all notifications for user
router.get('/', auth, notificationController.getNotifications);

// Get unread notifications count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', auth, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', auth, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', auth, notificationController.deleteNotification);

// Clear all read notifications
router.delete('/clear-read', auth, notificationController.clearReadNotifications);

module.exports = router;
