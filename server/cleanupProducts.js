const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function cleanupAllProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmconnect');
    console.log('Connected to MongoDB');
    
    // Find and remove all products
    const allProducts = await Product.find();
    console.log(`Found ${allProducts.length} products to remove`);
    
    if (allProducts.length > 0) {
      const result = await Product.deleteMany({});
      console.log(`✅ Removed ${result.deletedCount} products successfully`);
    } else {
      console.log('No products found');
    }
    
  } catch (error) {
    console.error('Error cleaning up products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupAllProducts();
