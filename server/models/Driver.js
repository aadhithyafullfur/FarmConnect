const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for backward compatibility
  },
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
  phone: {
    type: String,
    required: false, // Made optional for main registration
    trim: true
  },
  driverId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: false, // Made optional for main registration
    trim: true
  },
  vehicle: {
    type: {
      type: String,
      required: true,
      enum: ['motorcycle', 'car', 'van', 'truck']
    },
    make: {
      type: String,
      required: false, // Made optional for main registration
      trim: true
    },
    model: {
      type: String,
      required: false, // Made optional for main registration
      trim: true
    },
    plateNumber: {
      type: String,
      required: false, // Made optional for main registration
      trim: true
    },
    year: {
      type: Number,
      required: true
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  location: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  documents: {
    licenseImage: {
      type: String,
      trim: true
    },
    vehicleRegistration: {
      type: String,
      trim: true
    },
    profileImage: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Index for location-based queries
driverSchema.index({ "location.latitude": 1, "location.longitude": 1 });

// Index for availability queries
driverSchema.index({ "availability.isAvailable": 1 });

// Method to update location
driverSchema.methods.updateLocation = function(latitude, longitude) {
  this.location.latitude = latitude;
  this.location.longitude = longitude;
  this.location.lastUpdated = new Date();
  return this.save();
};

// Method to toggle availability
driverSchema.methods.toggleAvailability = function() {
  this.availability.isAvailable = !this.availability.isAvailable;
  this.availability.lastUpdated = new Date();
  return this.save();
};

// Method to update rating
driverSchema.methods.updateRating = function(newRating) {
  const totalScore = this.rating.average * this.rating.totalRatings;
  this.rating.totalRatings += 1;
  this.rating.average = (totalScore + newRating) / this.rating.totalRatings;
  return this.save();
};

module.exports = mongoose.model('Driver', driverSchema);
