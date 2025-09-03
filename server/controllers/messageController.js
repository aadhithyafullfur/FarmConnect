const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user._id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const message = new Message({
      senderId,
      recipientId,
      content
    });

    await message.save();

    // Emit socket event
    req.app.get('io').emit('newMessage', {
      message,
      sender: req.user.name
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while sending message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const senderId = req.user._id;

    // Get messages between these two users
    const messages = await Message.find({
      $or: [
        { senderId, recipientId },
        { senderId: recipientId, recipientId: senderId }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(100);

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
    console.error(err);
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
