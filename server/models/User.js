const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: { 
    type: String, 
    enum: ['buyer', 'farmer', 'admin'],
    default: 'buyer'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    trim: true
  },
  // Farmer specific fields
  farmName: {
    type: String,
    trim: true
  },
  farmDescription: {
    type: String,
    trim: true
  },
  farmSize: {
    type: Number,
    min: 0
  },
  farmSizeUnit: {
    type: String,
    enum: ['acres', 'hectares', 'sq_ft', 'sq_m'],
    default: 'acres'
  },
  establishedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  farmingMethods: [{
    type: String,
    enum: ['organic', 'conventional', 'hydroponic', 'permaculture', 'biodynamic']
  }],
  specializations: [{
    type: String,
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'poultry', 'livestock', 'herbs', 'spices']
  }],
  certifications: [{
    name: {
      type: String,
      trim: true
    },
    issuedBy: {
      type: String,
      trim: true
    },
    validUntil: Date,
    certificateUrl: String
  }],
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  // Buyer specific fields
  preferences: {
    organicOnly: {
      type: Boolean,
      default: false
    },
    maxDeliveryDistance: {
      type: Number,
      default: 50 // in km
    },
    favoriteCategories: [{
      type: String
    }],
    priceRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 10000
      }
    }
  },
  // Common fields
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['aadhar', 'pan', 'license', 'land_records', 'other']
    },
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  socialLinks: {
    website: String,
    facebook: String,
    instagram: String,
    youtube: String
  },
  businessHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },
  paymentMethods: [{
    type: String,
    enum: ['cash', 'upi', 'card', 'bank_transfer', 'wallet']
  }],
  notifications: {
    email: {
      newOrders: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    sms: {
      newOrders: { type: Boolean, default: true },
      messages: { type: Boolean, default: false },
      promotions: { type: Boolean, default: false }
    }
  },
  // Settings for profile management
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  marketingEmails: {
    type: Boolean,
    default: false
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  deactivatedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better search performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'location.city': 1, role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

// Method to calculate average rating
userSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating.average = Number((sum / this.reviews.length).toFixed(1));
    this.rating.count = this.reviews.length;
  }
};

// Pre-save middleware to calculate average rating and update lastActive
userSchema.pre('save', function() {
  this.calculateAverageRating();
  this.lastActive = new Date();
});

module.exports = mongoose.model('User', userSchema);