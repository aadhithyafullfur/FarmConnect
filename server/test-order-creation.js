const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

async function testOrderCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');

    // Find a test product and user
    const product = await Product.findOne();
    let user = await User.findOne({ userType: 'buyer' });
    
    if (!product) {
      console.log('No products found. Please run seedProducts.js first');
      return;
    }
    
    if (!user) {
      console.log('No buyer found. Creating test buyer...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = new User({
        username: 'testbuyer',
        email: 'buyer@test.com',
        password: hashedPassword,
        userType: 'buyer',
        name: 'Test Buyer'
      });
      await user.save();
      console.log('Test buyer created');
    }

    console.log('Testing order creation with:');
    console.log('Product:', product.name);
    console.log('Buyer:', user?.name);

    // Test order creation
    const testOrder = new Order({
      orderId: 'TEST-' + Date.now(),
      buyerId: user._id,
      items: [{
        productId: product._id,
        farmerId: product.farmerId,
        productName: product.name,
        quantity: 1,
        pricePerUnit: product.price,
        totalPrice: product.price,
        unit: product.unit
      }],
      totalAmount: product.price,
      finalAmount: product.price,
      paymentMethod: 'cash',
      status: 'pending',
      deliveryInfo: {
        type: 'delivery',
        address: {
          street: 'Test Address 123'
        },
        instructions: 'Test instructions'
      }
    });

    console.log('Attempting to save order...');
    await testOrder.save();
    console.log('✅ Order created successfully!');
    console.log('Order ID:', testOrder.orderId);

  } catch (error) {
    console.error('❌ Error creating order:', error);
    if (error.errors) {
      for (const field in error.errors) {
        console.error(`Field ${field}:`, error.errors[field].message);
      }
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testOrderCreation();