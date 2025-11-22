const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// REGISTER
exports.register = async (req, res) => {
  console.log('Registration attempt:', req.body);
  const { name, email, password, role } = req.body;

  try {
    // Verify MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('Database connection issue');
      return res.status(500).json({ msg: 'Database connection is not ready. Please try again.' });
    }

    // Check if user already exists
    console.log('Checking if user exists:', email);
    let user = await User.findOne({ email }).maxTimeMS(5000);  // Add timeout
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log('Creating user:', { name, email, role });
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'buyer'
    });

    console.log('Saving user to database...');
    await user.save();

    // Generate token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }

    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Registration successful');
    res.status(201).json({
      msg: 'User registered successfully',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Error in register controller:', err);
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    let msg = 'Server error';
    if (err.name === 'ValidationError') {
      msg = err.message;
    } else if (err.code === 11000) {
      msg = 'Email already exists';
    } else if (err.message) {
      msg = err.message;
    }
    res.status(500).json({ msg, error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      msg: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Error in login controller:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// VERIFY TOKEN
exports.verifyToken = async (req, res) => {
  try {
    // Token is already verified by auth middleware
    // Just return user data to confirm token is valid
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({
      valid: true,
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (err) {
    console.error('Error in verifyToken controller:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in getProfile controller:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, bio } = req.body;
    
    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (bio) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      msg: 'Profile updated successfully',
      user
    });
  } catch (err) {
    console.error('Error in updateProfile controller:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword
    });

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error('Error in changePassword controller:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// UPDATE SETTINGS
exports.updateSettings = async (req, res) => {
  try {
    const { emailNotifications, smsNotifications, marketingEmails, twoFactorAuth } = req.body;

    const updateData = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;
    if (twoFactorAuth !== undefined) updateData.twoFactorAuth = twoFactorAuth;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      msg: 'Settings updated successfully',
      user
    });
  } catch (err) {
    console.error('Error in updateSettings controller:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// DELETE ACCOUNT - COMPLETE DATA REMOVAL FROM MONGODB
exports.deactivateAccount = async (req, res) => {
  console.log('🗑️  ACCOUNT DELETION STARTED for user:', req.user?.id);
  
  try {
    const userId = req.user.id;
    console.log('🔍 Processing deletion for userId:', userId);
    
    // First, find the user to confirm it exists and get role info
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log(`🎯 Starting complete account deletion for user: ${userId} (${user.role})`);
    
    const deletionResults = {
      user: false,
      products: 0,
      orders: 0,
      cart: false,
      messages: 0,
      notifications: 0,
      purchases: 0
    };

    // 1. Delete user's products if they are a farmer
    try {
      const Product = require('../models/Product');
      const productDeleteResult = await Product.deleteMany({ farmerId: userId });
      deletionResults.products = productDeleteResult.deletedCount;
      console.log(`Deleted ${productDeleteResult.deletedCount} products for farmer: ${userId}`);
    } catch (productError) {
      console.error('Error deleting products:', productError.message);
    }

    // 2. Delete user's cart
    try {
      const Cart = require('../models/Cart');
      const cartDeleteResult = await Cart.deleteOne({ userId: userId });
      deletionResults.cart = cartDeleteResult.deletedCount > 0;
      console.log(`Deleted cart for user: ${userId}`);
    } catch (cartError) {
      console.error('Error deleting cart:', cartError.message);
    }

    // 3. Delete orders where user is buyer OR farmer
    try {
      const Order = require('../models/Order');
      
      // Delete orders where user is the buyer
      const buyerOrdersResult = await Order.deleteMany({ buyerId: userId });
      
      // Delete orders where user is the farmer (check items array)
      const farmerOrdersResult = await Order.deleteMany({ 
        'items.farmerId': userId 
      });
      
      deletionResults.orders = buyerOrdersResult.deletedCount + farmerOrdersResult.deletedCount;
      console.log(`Deleted ${deletionResults.orders} orders for user: ${userId}`);
    } catch (orderError) {
      console.error('Error deleting orders:', orderError.message);
    }

    // 4. Delete purchases (both as buyer and farmer)
    try {
      const Purchase = require('../models/Purchase');
      const purchaseDeleteResult = await Purchase.deleteMany({ 
        $or: [
          { buyer: userId },
          { farmer: userId },
          { buyerId: userId },
          { farmerId: userId }
        ]
      });
      deletionResults.purchases = purchaseDeleteResult.deletedCount;
      console.log(`Deleted ${purchaseDeleteResult.deletedCount} purchases for user: ${userId}`);
    } catch (purchaseError) {
      console.error('Error deleting purchases:', purchaseError.message);
    }

    // 5. Delete messages (as sender or recipient)
    try {
      const Message = require('../models/Message');
      const messageDeleteResult = await Message.deleteMany({ 
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ]
      });
      deletionResults.messages = messageDeleteResult.deletedCount;
      console.log(`Deleted ${messageDeleteResult.deletedCount} messages for user: ${userId}`);
    } catch (messageError) {
      console.error('Error deleting messages:', messageError.message);
    }

    // 6. Delete notifications related to this user
    try {
      const Notification = require('../models/Notification');
      const notificationDeleteResult = await Notification.deleteMany({ 
        $or: [
          { user: userId },
          { fromUser: userId },
          { userId: userId }
        ]
      });
      deletionResults.notifications = notificationDeleteResult.deletedCount;
      console.log(`Deleted ${notificationDeleteResult.deletedCount} notifications for user: ${userId}`);
    } catch (notificationError) {
      console.error('Error deleting notifications:', notificationError.message);
    }

    // 7. Finally, delete the user account itself
    try {
      const userDeleteResult = await User.findByIdAndDelete(userId);
      deletionResults.user = userDeleteResult !== null;
      console.log(`Successfully deleted user account: ${userId}`);
    } catch (userError) {
      console.error('Error deleting user account:', userError.message);
      throw new Error('Failed to delete user account');
    }

    // Log successful deletion
    console.log('Account deletion completed:', deletionResults);

    res.json({ 
      msg: 'Account and all associated data have been permanently deleted from MongoDB Atlas',
      deletedData: deletionResults,
      summary: {
        userAccount: deletionResults.user,
        products: `${deletionResults.products} products deleted`,
        orders: `${deletionResults.orders} orders deleted`,
        cart: deletionResults.cart ? 'Cart deleted' : 'No cart found',
        messages: `${deletionResults.messages} messages deleted`,
        notifications: `${deletionResults.notifications} notifications deleted`,
        purchases: `${deletionResults.purchases} purchase records deleted`
      }
    });

  } catch (err) {
    console.error('Error in complete account deletion:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ 
      msg: 'Server error during account deletion', 
      error: err.message,
      hint: 'Please contact support if this error persists'
    });
  }
};

// GET ALL USERS (for chat/messaging purposes)
exports.getAllUsers = async (req, res) => {
  try {
    console.log('📋 Fetching all users for messaging...');
    
    // Fetch all users, excluding password field
    const users = await User.find({}).select('-password');
    
    console.log(`✅ Retrieved ${users.length} users`);
    
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ 
      msg: 'Error fetching users', 
      error: err.message 
    });
  }
};
