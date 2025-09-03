const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function cleanupDriverUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmconnect');
    console.log('Connected to MongoDB');
    
    // Find and remove all driver users
    const driverUsers = await User.find({ role: 'driver' });
    console.log(`Found ${driverUsers.length} driver users to remove`);
    
    if (driverUsers.length > 0) {
      const result = await User.deleteMany({ role: 'driver' });
      console.log(`Removed ${result.deletedCount} driver users`);
    } else {
      console.log('No driver users found');
    }
    
  } catch (error) {
    console.error('Error cleaning up driver users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupDriverUsers();
