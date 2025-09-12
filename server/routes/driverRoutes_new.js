const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const Order = require('../models/Order');
const driverAuth = require('../middleware/driverAuth');

const router = express.Router();

// Driver registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, licenseNumber, vehicle } = req.body;

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ msg: 'Driver already exists' });
    }

    // Generate driver ID
    const driverCount = await Driver.countDocuments();
    const driverId = `DRV${String(driverCount + 1).padStart(4, '0')}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create driver
    const driver = new Driver({
      name,
      email,
      password: hashedPassword,
      phone,
      driverId,
      licenseNumber,
      vehicle: {
        type: vehicle.type,
        make: vehicle.make || '',
        model: vehicle.model || '',
        plateNumber: vehicle.plateNumber || '',
        year: vehicle.year || new Date().getFullYear()
      },
      availability: {
        isAvailable: true,
        lastUpdated: new Date()
      }
    });

    await driver.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: driver._id, email: driver.email, type: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      msg: 'Driver registered successfully',
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        driverId: driver.driverId,
        phone: driver.phone,
        vehicle: driver.vehicle,
        availability: driver.availability
      }
    });

  } catch (error) {
    console.error('Driver registration error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Driver login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find driver
    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: driver._id, email: driver.email, type: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      msg: 'Login successful',
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        driverId: driver.driverId,
        phone: driver.phone,
        vehicle: driver.vehicle,
        availability: driver.availability,
        location: driver.location,
        rating: driver.rating
      }
    });

  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get driver profile
router.get('/profile', driverAuth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).select('-password');
    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    res.json({
      success: true,
      driver
    });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update driver location
router.post('/location', driverAuth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const driver = await Driver.findById(req.driver._id);
    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    driver.location = {
      latitude,
      longitude,
      lastUpdated: new Date()
    };

    await driver.save();

    // Emit location update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('driverLocationUpdate', {
        driverId: driver._id,
        location: driver.location
      });
    }

    res.json({
      success: true,
      msg: 'Location updated successfully',
      location: driver.location
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update driver availability
router.post('/availability', driverAuth, async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const driver = await Driver.findById(req.driver._id);
    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    driver.availability = {
      isAvailable,
      lastUpdated: new Date()
    };

    await driver.save();

    res.json({
      success: true,
      msg: 'Availability updated successfully',
      availability: driver.availability
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get available orders for driver
router.get('/available-orders', driverAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'ready_for_pickup',
      'driver.driverId': null
    }).populate('buyerId', 'name phone address')
      .populate('items.farmerId', 'name phone farmName address');

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Accept delivery task
router.post('/accept-order/:orderId', driverAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (order.driver.driverId) {
      return res.status(400).json({ msg: 'Order already assigned to another driver' });
    }

    const driver = await Driver.findById(req.driver._id);
    if (!driver.availability.isAvailable) {
      return res.status(400).json({ msg: 'Driver is not available' });
    }

    // Assign driver to order
    order.driver = {
      driverId: req.driver._id,
      assignedAt: new Date(),
      status: 'assigned'
    };
    order.status = 'out_for_delivery';

    await order.save();

    // Update driver availability
    driver.availability.isAvailable = false;
    await driver.save();

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.buyerId}`).emit('orderUpdate', {
        orderId: order._id,
        status: 'out_for_delivery',
        message: 'Your order is out for delivery!',
        driver: {
          name: driver.name,
          phone: driver.phone,
          vehicle: driver.vehicle
        }
      });
    }

    res.json({
      success: true,
      msg: 'Order accepted successfully',
      order
    });

  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get driver's assigned orders
router.get('/my-orders', driverAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      'driver.driverId': req.driver._id
    }).populate('buyerId', 'name phone address')
      .populate('items.farmerId', 'name phone farmName address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get driver orders error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update delivery status
router.post('/update-status/:orderId', driverAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['picked_up', 'in_transit', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (order.driver.driverId.toString() !== req.driver._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this order' });
    }

    // Update order status
    order.status = status === 'picked_up' ? 'out_for_delivery' : 
                   status === 'in_transit' ? 'out_for_delivery' : 'delivered';
    
    order.driver.status = status;
    order.driver.lastUpdated = new Date();

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      
      // Make driver available again
      const driver = await Driver.findById(req.driver._id);
      driver.availability.isAvailable = true;
      await driver.save();
    }

    await order.save();

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      const statusMessages = {
        picked_up: 'Your order has been picked up by the driver',
        in_transit: 'Your order is on the way',
        delivered: 'Your order has been delivered successfully!'
      };

      io.to(`user_${order.buyerId}`).emit('orderUpdate', {
        orderId: order._id,
        status: status,
        message: statusMessages[status]
      });
    }

    res.json({
      success: true,
      msg: 'Status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get nearby drivers for order assignment
router.get('/nearby/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const radius = 50; // 50km radius

    const drivers = await Driver.find({
      'availability.isAvailable': true,
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null }
    });

    // Calculate distance and filter nearby drivers
    const nearbyDrivers = drivers.filter(driver => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        driver.location.latitude,
        driver.location.longitude
      );
      return distance <= radius;
    }).map(driver => ({
      ...driver.toObject(),
      distance: calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        driver.location.latitude,
        driver.location.longitude
      )
    })).sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      drivers: nearbyDrivers
    });

  } catch (error) {
    console.error('Get nearby drivers error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

module.exports = router;
