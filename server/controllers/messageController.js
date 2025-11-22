const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, senderId } = req.body;
    
    // Use senderId from request body or from authenticated user
    const actualSenderId = senderId || (req.user && req.user._id);
    
    if (!actualSenderId || !recipientId || !content) {
      console.error('❌ Missing required fields:', { actualSenderId, recipientId, content: content ? 'YES' : 'NO' });
      return res.status(400).json({ error: 'Missing required fields: senderId, recipientId, content' });
    }

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      console.error('❌ Recipient not found:', recipientId);
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Validate sender exists
    const sender = await User.findById(actualSenderId);
    if (!sender) {
      console.error('❌ Sender not found:', actualSenderId);
      return res.status(404).json({ error: 'Sender not found' });
    }

    const message = new Message({
      senderId: actualSenderId,
      recipientId,
      content
    });

    await message.save();
    
    console.log(`✅ Message saved: ${actualSenderId} → ${recipientId}: "${content.substring(0, 50)}..."`);

    // Emit socket event to recipient
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${recipientId}`).emit('newMessage', {
        _id: message._id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        content: message.content,
        createdAt: message.createdAt,
        delivered: true
      });
      console.log(`📡 Socket.io emitted to user_${recipientId}`);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('❌ Error in sendMessage:', err);
    res.status(500).json({ error: 'Server error while sending message: ' + err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    let { recipientId } = req.params;
    let senderId = req.user._id;

    // Ensure ObjectIds are properly formatted
    recipientId = new mongoose.Types.ObjectId(recipientId);
    senderId = new mongoose.Types.ObjectId(senderId);

    console.log(`📨 Fetching messages between ${senderId} and ${recipientId}`);

    // Get messages between these two users
    const messages = await Message.find({
      $or: [
        { senderId, recipientId },
        { senderId: recipientId, recipientId: senderId }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(100);

    console.log(`✅ Found ${messages.length} messages`);

    // Mark received messages as read
    await Message.updateMany(
      { 
        senderId: recipientId,
        recipientId: senderId,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Server error while fetching messages' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipientId: req.user._id,
      read: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while getting unread count' });
  }
};

exports.getChatList = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get the last message from each conversation
    const lastMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { recipientId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$recipientId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          'user.name': 1,
          'user.email': 1
        }
      }
    ]);

    res.json(lastMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching chat list' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate message ID
    if (!id) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      console.error('❌ Message not found:', id);
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender (only sender can delete)
    if (message.senderId.toString() !== userId.toString()) {
      console.error('❌ Unauthorized delete attempt:', { messageId: id, userId });
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Delete the message
    await Message.findByIdAndDelete(id);
    console.log(`✅ Message deleted: ${id} by user ${userId}`);

    // Emit socket event to notify recipient
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${message.recipientId}`).emit('messageDeleted', {
        messageId: id,
        deletedBy: userId
      });
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting message:', err);
    res.status(500).json({ error: 'Server error while deleting message' });
  }
};
