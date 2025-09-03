const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  category: { 
    type: String, 
    enum: ['vegetable', 'fruit', 'grain', 'dairy', 'meat', 'herbs', 'spices', 'nuts', 'seeds', 'other'],
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 0 
  },
  unit: { 
    type: String, 
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'bunch', 'bag', 'box'],
    required: true 
  },
  image: { 
    type: String,
    trim: true 
  },
  cropType: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  expirationDate: { 
    type: Date, 
    required: true 
  },
  harvestDate: {
    type: Date
  },
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  farmName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  farmLocation: {
    type: String,
    trim: true
  },
  farmingMethod: {
    type: String,
    enum: ['traditional', 'organic', 'hydroponic', 'greenhouse', 'permaculture'],
    default: 'traditional'
  },
  freshnessPeriod: {
    type: Number, // in days
    min: 0
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  deliveryOptions: {
    homeDelivery: { type: Boolean, default: false },
    pickupFromFarm: { type: Boolean, default: false },
    marketDelivery: { type: Boolean, default: false }
  },
  deliveryRadius: {
    type: Number,
    default: 10,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumOrder: {
    type: Number,
    default: 1,
    min: 0
  },
  organicCertified: {
    type: Boolean,
    default: false
  },
  certificationDetails: {
    type: String,
    trim: true
  },
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    vitamins: [String]
  },
  storageInstructions: {
    type: String,
    trim: true
  },
  preparationTips: {
    type: String,
    trim: true
  },
  seasonality: {
    type: String,
    enum: ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'year_round'],
    default: 'year_round'
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'expired', 'out_of_stock'],
    default: 'available'
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  bulkPricing: [{
    minimumQuantity: {
      type: Number,
      required: true
    },
    pricePerUnit: {
      type: Number,
      required: true
    }
  }],
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', farmName: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ location: 1, status: 1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ farmerId: 1, status: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discountPercentage > 0) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
});

// Method to calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Number((sum / this.ratings.length).toFixed(1));
    this.totalRatings = this.ratings.length;
  }
};

// Pre-save middleware to calculate average rating
productSchema.pre('save', function() {
  this.calculateAverageRating();
});

module.exports = mongoose.model('Product', productSchema);