const express = require('express');
const {
  sendMessage,
  getMessages,
  getUnreadCount,
  getChatList
} = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.get('/chat/:recipientId', authMiddleware, getMessages);
router.get('/unread', authMiddleware, getUnreadCount);
router.get('/chats', authMiddleware, getChatList);

module.exports = router;
