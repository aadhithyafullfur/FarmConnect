const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Fresh Tomatoes',
    description: 'Organic red tomatoes, freshly harvested from our farm',
    price: 25,
    category: 'vegetable',
    quantity: 100,
    unit: 'kg',
    farmerId: null, // Will be set dynamically
    image: '/crops/tomato.jpg',
    isOrganic: true,
    status: 'available',
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    harvestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    name: 'Sweet Potatoes',
    description: 'Fresh sweet potatoes, perfect for roasting',
    price: 30,
    category: 'vegetable',
    quantity: 50,
    unit: 'kg',
    farmerId: null,
    image: '/crops/potato.jpg',
    isOrganic: false,
    status: 'available',
    expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    harvestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    name: 'Fresh Apples',
    description: 'Crisp and juicy apples from our orchard',
    price: 80,
    category: 'fruit',
    quantity: 75,
    unit: 'kg',
    farmerId: null,
    image: '/crops/apple.jpg',
    isOrganic: true,
    status: 'available',
    expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    harvestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    name: 'Organic Carrots',
    description: 'Fresh orange carrots, grown without pesticides',
    price: 40,
    category: 'vegetable',
    quantity: 60,
    unit: 'kg',
    farmerId: null,
    image: '/crops/carrot.jpg',
    isOrganic: true,
    status: 'available',
    expirationDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    harvestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    name: 'Fresh Bananas',
    description: 'Ripe yellow bananas, perfect for smoothies',
    price: 60,
    category: 'fruit',
    quantity: 80,
    unit: 'kg',
    farmerId: null,
    image: '/crops/banana.jpg',
    isOrganic: false,
    status: 'available',
    expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    harvestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    name: 'Organic Broccoli',
    description: 'Fresh green broccoli, packed with nutrients',
    price: 70,
    category: 'vegetable',
    quantity: 40,
    unit: 'kg',
    farmerId: null,
    image: '/crops/broccoli.jpg',
    isOrganic: true,
    status: 'available',
    expirationDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    harvestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  }
];

async function seedProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Find or create a sample farmer - try both role and userType for compatibility
    let farmer = await User.findOne({ $or: [{ role: 'farmer' }, { userType: 'farmer' }] });
    if (!farmer) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      farmer = new User({
        name: 'Sample Farmer',
        username: 'samplefarmer',
        email: 'farmer@example.com',
        password: hashedPassword,
        role: 'farmer',
        userType: 'farmer', // Add both for compatibility
        phone: '+1234567890',
        farmName: 'Green Valley Farm',
        location: {
          address: 'Sample Farm Address',
          coordinates: [77.5946, 12.9716] // Bangalore coordinates
        }
      });
      await farmer.save();
      console.log('Created sample farmer');
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add farmerId to products
    const productsWithFarmer = sampleProducts.map(product => ({
      ...product,
      farmerId: farmer._id
    }));

    // Insert sample products
    const insertedProducts = await Product.insertMany(productsWithFarmer);
    console.log(`Inserted ${insertedProducts.length} products successfully`);

    console.log('Sample products:');
    insertedProducts.forEach(product => {
      console.log(`- ${product.name}: ₹${product.price}/${product.unit} (${product.quantity} available)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();