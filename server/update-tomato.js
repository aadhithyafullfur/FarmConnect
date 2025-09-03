require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function updateTomato() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmconnect');
    console.log('Connected to MongoDB');
    
    // Update the tomato product to use the real JPG image
    const result = await Product.updateOne(
      { name: 'Tomato' },
      { $set: { image: '/crops/tomato.jpg' } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const tomato = await Product.findOne({ name: 'Tomato' });
    console.log('Updated tomato:');
    console.log('  Name:', tomato.name);
    console.log('  Image:', tomato.image);
    console.log('  CropType:', tomato.cropType);
    
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateTomato();
