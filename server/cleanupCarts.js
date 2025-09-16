const mongoose = require('mongoose');
const Cart = require('./models/Cart');
const Product = require('./models/Product');
require('dotenv').config();

async function cleanupCarts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Find all carts and populate productId to check for null references
    const carts = await Cart.find({}).populate('items.productId');
    
    let totalCleaned = 0;
    
    for (const cart of carts) {
      const originalItemCount = cart.items.length;
      
      // Filter out items with null productId
      cart.items = cart.items.filter(item => item.productId !== null);
      
      const newItemCount = cart.items.length;
      const itemsRemoved = originalItemCount - newItemCount;
      
      if (itemsRemoved > 0) {
        await cart.save();
        console.log(`Cleaned cart ${cart._id}: removed ${itemsRemoved} invalid items`);
        totalCleaned += itemsRemoved;
      }
    }
    
    console.log(`\nCleanup completed! Removed ${totalCleaned} invalid cart items total.`);
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up carts:', error);
    process.exit(1);
  }
}

cleanupCarts();