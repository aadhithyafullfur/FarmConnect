const express = require('express');
const {
  sendMessage,
  getMessages,
  getUnreadCount,
  getChatList,
  deleteMessage
} = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.get('/chat/:recipientId', authMiddleware, getMessages);
router.get('/unread', authMiddleware, getUnreadCount);
router.get('/chats', authMiddleware, getChatList);
router.delete('/:id', authMiddleware, deleteMessage);

module.exports = router;
