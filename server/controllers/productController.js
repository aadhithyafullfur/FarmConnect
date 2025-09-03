const Product = require('../models/Product');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPG, PNG and WebP images are allowed'));
  }
}).single('image');

// Handle file upload middleware
exports.uploadImage = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Create a new product

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    console.log('File:', req.file);
    console.log('User from auth:', req.user);
    
    const { 
      name, 
      description, 
      price, 
      category, 
      quantity, 
      unit,
      expirationDate,
      minimumOrder,
      organicCertified,
      freshnessPeriod,
      harvestDate,
      farmLocation,
      farmingMethod,
      deliveryOptions,
      deliveryRadius,
      shippingCost,
      status,
      cropType,
      useDefaultImage
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !quantity || !unit) {
      return res.status(400).json({ 
        error: 'Required fields: name, description, price, category, quantity, unit' 
      });
    }

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      quantity: Number(quantity),
      unit,
      expirationDate: expirationDate ? new Date(expirationDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
      minimumOrder: Number(minimumOrder) || 1,
      organicCertified: organicCertified === 'true' || organicCertified === true,
      freshnessPeriod: freshnessPeriod ? Number(freshnessPeriod) : undefined,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      farmLocation: farmLocation?.trim() || 'Not specified',
      farmingMethod: farmingMethod || 'traditional',
      deliveryOptions: deliveryOptions ? JSON.parse(deliveryOptions) : {},
      deliveryRadius: Number(deliveryRadius) || 10,
      shippingCost: Number(shippingCost) || 0,
      status: status || 'available',
      farmerId: req.user.id || req.user._id
    };

    // Add image path - either uploaded file or default crop image
    if (req.file) {
      productData.image = '/uploads/products/' + req.file.filename;
    } else if (cropType && useDefaultImage === 'true') {
      // Use default crop image - try JPG first, then SVG fallback
      productData.image = `/crops/${cropType}.jpg`;
      productData.cropType = cropType;
    }

    console.log('Final product data:', productData);

    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Server error while creating product: ' + err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verify ownership
    const product = await Product.findOne({ _id: id, farmerId: req.user._id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Convert numeric fields
    if (updates.price) updates.price = Number(updates.price);
    if (updates.quantity) updates.quantity = Number(updates.quantity);
    if (updates.expirationDate) updates.expirationDate = new Date(updates.expirationDate);
    
    // Add image path if new image was uploaded
    if (req.file) {
      updates.image = req.file.path;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, farmerId: req.user._id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while deleting product' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const query = {};

    // Apply filters
    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Only show products that haven't expired
    query.expirationDate = { $gt: new Date() };

    const products = await Product.find(query)
      .populate('farmerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching your products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('farmerId', 'name email');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching product' });
  }
};

exports.getFarmerAnalytics = async (req, res) => {
  try {
    const farmerId = req.user._id;
    
    // Get all products for this farmer
    const allProducts = await Product.find({ farmerId });
    
    // Get available products
    const availableProducts = await Product.find({ 
      farmerId, 
      status: 'available',
      quantity: { $gt: 0 }
    });
    
    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { farmerId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Get recent products (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentProducts = await Product.find({
      farmerId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(5);
    
    const analytics = {
      totalProducts: allProducts.length,
      availableProducts: availableProducts.length,
      productsByCategory,
      recentProducts
    };
    
    res.json(analytics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching analytics' });
  }
};