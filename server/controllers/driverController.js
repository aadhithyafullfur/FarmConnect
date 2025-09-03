const Driver = require('../models/Driver');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Driver Registration
const registerDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      driverId,
      licenseNumber,
      vehicle
    } = req.body;

    // Check if driver already exists
    const existingDriver = await Driver.findOne({
      $or: [{ email }, { driverId }]
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this email or driver ID already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate driver ID if not provided
    const finalDriverId = driverId || `DRV${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create new driver
    const newDriver = new Driver({
      name,
      email,
      password: hashedPassword,
      phone,
      driverId: finalDriverId,
      licenseNumber,
      vehicle
    });

    await newDriver.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newDriver._id, 
        type: 'driver',
        driverId: newDriver.driverId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      token,
      driver: {
        id: newDriver._id,
        name: newDriver.name,
        email: newDriver.email,
        phone: newDriver.phone,
        driverId: newDriver.driverId,
        vehicle: newDriver.vehicle,
        isVerified: newDriver.isVerified
      }
    });

  } catch (error) {
    console.error('Driver registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Driver Login
const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find driver by email
    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: driver._id, 
        type: 'driver',
        driverId: driver.driverId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        driverId: driver.driverId,
        vehicle: driver.vehicle,
        availability: driver.availability,
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        isVerified: driver.isVerified
      }
    });

  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get Driver Profile
const getDriverProfile = async (req, res) => {
  try {
    const User = require('../models/User');
    const userId = req.user.id;
    
    // Get user with driver profile
    const user = await User.findById(userId).populate('driverProfile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If no driver profile exists, create one
    if (!user.driverProfile) {
      const newDriver = new Driver({
        userId: user._id,
        driverId: `DRV${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        phoneNumber: user.phoneNumber || '',
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      });
      
      await newDriver.save();
      user.driverProfile = newDriver._id;
      await user.save();
      
      return res.json({
        success: true,
        ...newDriver.toObject(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      });
    }

    res.json({
      success: true,
      ...user.driverProfile.toObject(),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email
    });

  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Assigned Orders
const getAssignedOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const driverId = req.driver.driverId || req.driver.id;

    // Build filter - look for orders assigned to this driver or available orders
    const filter = {
      $or: [
        { 'driver.driverId': driverId },
        { status: 'pending', $or: [{ driver: { $exists: false } }, { driver: {} }] }
      ]
    };
    
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('buyerId', 'firstName lastName phone email')
      .populate('items.productId', 'name category')
      .populate('items.farmerId', 'firstName lastName phone farmName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      totalOrders
    });

  } catch (error) {
    console.error('Get assigned orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, latitude, longitude } = req.body;
    const driverId = req.driver.id;

    // Find the order
    const order = await Order.findOne({
      orderId,
      'driver.driverId': driverId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not assigned to you'
      });
    }

    // Update order status and tracking
    order.status = status;
    order.addTracking(status, notes, { latitude, longitude });

    // Update driver-specific timestamps
    const now = new Date();
    switch (status) {
      case 'out_for_delivery':
        order.driver.pickedUpAt = now;
        break;
      case 'delivered':
        order.driver.deliveredAt = now;
        order.actualDelivery = now;
        break;
    }

    // Update driver location if provided
    if (latitude && longitude) {
      order.driver.driverLocation = {
        latitude,
        longitude,
        lastUpdated: now
      };
    }

    if (notes) {
      order.driver.deliveryNotes = notes;
    }

    await order.save();

    // Update driver's total deliveries if order is completed
    if (status === 'delivered') {
      await Driver.findByIdAndUpdate(driverId, {
        $inc: { totalDeliveries: 1 }
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update Driver Location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const driverId = req.driver.id;

    await Driver.findByIdAndUpdate(driverId, {
      'location.latitude': latitude,
      'location.longitude': longitude,
      'location.lastUpdated': new Date()
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Toggle Availability
const toggleAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable } = req.body;
    const User = require('../models/User');

    // Get user with driver profile
    const user = await User.findById(userId).populate('driverProfile');
    
    if (!user || !user.driverProfile) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const driver = user.driverProfile;

    // If isAvailable is provided in request, use it; otherwise toggle current state
    if (typeof isAvailable === 'boolean') {
      if (!driver.availability) {
        driver.availability = {};
      }
      driver.availability.isAvailable = isAvailable;
    } else {
      if (driver.toggleAvailability) {
        await driver.toggleAvailability();
      } else {
        // Fallback if method doesn't exist
        if (!driver.availability) {
          driver.availability = {};
        }
        driver.availability.isAvailable = !driver.availability.isAvailable;
      }
    }

    await driver.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      isAvailable: driver.availability.isAvailable
    });

  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Delivery History
const getDeliveryHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const driverId = req.driver.id;

    const orders = await Order.find({
      'driver.driverId': driverId,
      status: 'delivered'
    })
      .populate('buyerId', 'name phone')
      .populate('items.farmerId', 'name farmName')
      .sort({ 'driver.deliveredAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments({
      'driver.driverId': driverId,
      status: 'delivered'
    });

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      totalOrders
    });

  } catch (error) {
    console.error('Get delivery history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Accept/Reject Order
const respondToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const driverId = req.driver.id;
    const driverInfo = req.driver;

    // If this is a direct accept call (from /accept endpoint), set action to accept
    const finalAction = action || 'accept';

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // For accept action, assign driver if not already assigned
    if (finalAction === 'accept') {
      if (!order.driver || !order.driver.driverId) {
        // Assign this driver to the order
        order.driver = {
          driverId: driverInfo.driverId,
          driverName: driverInfo.name,
          assignedAt: new Date(),
          acceptedAt: new Date()
        };
      } else {
        // Update acceptance time if driver is already assigned
        order.driver.acceptedAt = new Date();
      }
      order.status = 'accepted';
      order.addTracking && order.addTracking('accepted', 'Order accepted by driver');
    } else if (finalAction === 'reject') {
      // Remove driver assignment and make order available for other drivers
      order.driver = {};
      order.status = 'ready_for_pickup';
      order.addTracking && order.addTracking('ready_for_pickup', 'Order rejected by driver, reassigning...');
    }

    await order.save();

    res.json({
      success: true,
      message: `Order ${finalAction}ed successfully`,
      order
    });

  } catch (error) {
    console.error('Respond to order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Driver Earnings
const getDriverEarnings = async (req, res) => {
  try {
    const driverId = req.driver.driverId || req.driver.id;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get completed orders for this driver
    const completedOrders = await Order.find({
      'driver.driverId': driverId,
      status: 'delivered'
    });

    // Calculate earnings
    const earnings = {
      today: 0,
      week: 0,
      month: 0,
      total: 0
    };

    completedOrders.forEach(order => {
      const deliveryFee = order.deliveryFee || 50; // Default delivery fee
      const orderDate = new Date(order.updatedAt);
      
      earnings.total += deliveryFee;
      
      if (orderDate >= today) {
        earnings.today += deliveryFee;
      }
      
      if (orderDate >= startOfWeek) {
        earnings.week += deliveryFee;
      }
      
      if (orderDate >= startOfMonth) {
        earnings.month += deliveryFee;
      }
    });

    res.json({
      success: true,
      earnings
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching earnings'
    });
  }
};

module.exports = {
  registerDriver,
  loginDriver,
  getDriverProfile,
  getAssignedOrders,
  updateOrderStatus,
  updateLocation,
  toggleAvailability,
  getDeliveryHistory,
  respondToOrder,
  getDriverEarnings
};
