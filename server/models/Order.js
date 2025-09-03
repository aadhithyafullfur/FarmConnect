const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank_transfer', 'wallet'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paidAt: Date
  },
  driver: {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    pickedUpAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    deliveryNotes: {
      type: String,
      trim: true
    },
    driverLocation: {
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
        default: null
      }
    }
  },
  deliveryInfo: {
    type: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    contactPerson: {
      name: String,
      phone: String
    },
    scheduledDate: Date,
    timeSlot: String,
    instructions: String
  },
  tracking: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  estimatedDelivery: Date,
  actualDelivery: Date,
  notes: String,
  cancellationReason: String,
  refundAmount: Number,
  refundReason: String,
  rating: {
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ 'items.farmerId': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

// Pre-save middleware to generate order ID
orderSchema.pre('save', function() {
  if (this.isNew) {
    this.orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
});

// Method to add tracking update
orderSchema.methods.addTracking = function(status, notes, location) {
  this.tracking.push({
    status,
    notes,
    location,
    timestamp: new Date()
  });
  this.status = status;
};

module.exports = mongoose.model('Order', orderSchema);
