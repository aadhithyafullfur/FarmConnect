const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Create new order
const createOrder = async (req, res) => {
  try {
    console.log('=== ORDER CREATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user._id);
    console.log('==============================');

    const { items, deliveryAddress, paymentMethod, specialInstructions, totalAmount } = req.body;
    const buyerId = req.user._id;

    // Validate required fields
    if (!items || items.length === 0) {
      console.error('❌ Validation failed: No items in order');
      return res.status(400).json({ error: 'No items in order' });
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      console.error('❌ Validation failed: Delivery address is required');
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    if (!paymentMethod) {
      console.error('❌ Validation failed: Payment method is required');
      return res.status(400).json({ error: 'Payment method is required' });
    }

    console.log(`✅ Validation passed. Processing ${items.length} items`);

    // Verify product availability and calculate total
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.product}` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price || product.price,
        farmer: product.farmerId,
        productName: product.name,
        unit: product.unit
      });

      calculatedTotal += (item.price || product.price) * item.quantity;

      // Update product quantity
      product.quantity -= item.quantity;
      await product.save();
    }

    // Create order
    const order = new Order({
      orderId: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      buyerId: buyerId,
      items: orderItems.map(item => ({
        productId: item.product,
        farmerId: item.farmer,
        productName: item.productName || 'Product',
        quantity: item.quantity,
        pricePerUnit: item.price,
        totalPrice: item.price * item.quantity,
        unit: item.unit || 'kg'
      })),
      totalAmount: calculatedTotal,
      finalAmount: calculatedTotal,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      deliveryInfo: {
        type: 'delivery',
        address: {
          street: deliveryAddress // Store the full address as street for now
        },
        instructions: specialInstructions
      }
    });

    await order.save();

    // Clear user's cart
    await Cart.findOneAndDelete({ userId: buyerId });

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('buyerId', 'name email')
      .populate('items.productId', 'name price unit image')
      .populate('items.farmerId', 'name email');

    // Send notifications to farmers
    const farmerNotifications = [];
    const uniqueFarmers = [...new Set(orderItems.map(item => item.farmer.toString()))];
    
    for (const farmerId of uniqueFarmers) {
      const farmerProducts = orderItems
        .filter(item => item.farmer.toString() === farmerId)
        .map(item => item.product);
      
      const farmer = await User.findById(farmerId);
      const productNames = await Product.find({ _id: { $in: farmerProducts } }).select('name');
      
      const notificationData = {
        recipient: farmerId,
        sender: buyerId,
        type: 'order_placed',
        title: 'New Order Received!',
        message: `You have received a new order for ${productNames.map(p => p.name).join(', ')}`,
        data: {
          orderId: order._id,
          amount: calculatedTotal,
          status: 'pending',
          additionalInfo: {
            buyerName: populatedOrder.buyerId.name,
            itemCount: orderItems.length
          }
        },
        priority: 'high'
      };

      try {
        await createNotification(notificationData);
        farmerNotifications.push(farmerId);
      } catch (error) {
        console.error('Error sending notification to farmer:', farmerId, error);
      }
    }

    console.log(`Order created successfully. Notifications sent to ${farmerNotifications.length} farmers.`);

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    console.error('Error stack:', error.stack);
    
    // Log validation errors
    if (error.errors) {
      console.error('Mongoose validation errors:');
      for (const field in error.errors) {
        console.error(`  ${field}: ${error.errors[field].message}`);
      }
    }
    
    // Return appropriate error response
    if (error.errors) {
      // Mongoose validation error
      const validationErrors = Object.entries(error.errors)
        .map(([field, err]) => `${field}: ${err.message}`)
        .join('; ');
      return res.status(400).json({ error: validationErrors });
    }
    
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
};

// Get buyer's orders
const getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user._id;
    
    const orders = await Order.find({ buyerId: buyerId })
      .populate('buyerId', 'name email')
      .populate('items.productId', 'name price unit image')
      .populate('items.farmerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get farmer's orders
const getFarmerOrders = async (req, res) => {
  try {
    const farmerId = req.user._id;
    
    const orders = await Order.find({ 'items.farmerId': farmerId })
      .populate('buyerId', 'name email phone')
      .populate('items.productId', 'name price unit image')
      .populate('items.farmerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name price unit image')
      .populate('items.farmer', 'name email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user has permission to view this order
    const isBuyer = order.buyer._id.toString() === userId;
    const isFarmer = order.items.some(item => item.farmer._id.toString() === userId);

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order status (farmer only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const farmerId = req.user._id;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if farmer has permission to update this order
    const isFarmer = order.items.some(item => item.farmer.toString() === farmerId);
    if (!isFarmer) {
      return res.status(403).json({ error: 'Access denied' });
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    // If order is marked as ready, find and assign nearest driver
    if (status === 'ready') {
      try {
        await assignNearestDriver(order);
      } catch (error) {
        console.error('Error assigning driver:', error);
        // Continue even if driver assignment fails
      }
    }

    const updatedOrder = await Order.findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name price unit image')
      .populate('items.farmer', 'name email');

    // Send notification to buyer about status update
    const statusMessages = {
      'confirmed': 'Your order has been confirmed',
      'preparing': 'Your order is being prepared',
      'ready': 'Your order is ready for pickup/delivery',
      'shipped': 'Your order has been shipped',
      'delivered': 'Your order has been delivered',
      'cancelled': 'Your order has been cancelled'
    };

    if (statusMessages[status]) {
      const notificationData = {
        recipient: order.buyer,
        sender: farmerId,
        type: `order_${status}`,
        title: 'Order Status Update',
        message: statusMessages[status],
        data: {
          orderId: order._id,
          status: status,
          additionalInfo: {
            farmerName: updatedOrder.items[0].farmer.name
          }
        },
        priority: status === 'delivered' ? 'high' : 'medium'
      };

      try {
        await createNotification(notificationData);
        console.log(`Status update notification sent to buyer for order ${orderId}`);
      } catch (error) {
        console.error('Error sending status update notification:', error);
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Cancel order (buyer only)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const buyerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if buyer owns this order
    if (order.buyer.toString() !== buyerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow cancellation for pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    // Restore product quantities
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name price unit image')
      .populate('items.farmer', 'name email');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Helper function to assign nearest available driver
const assignNearestDriver = async (order) => {
  try {
    const Driver = require('../models/Driver');
    
    // Get delivery address coordinates (assuming they're stored)
    // For now, we'll use a default location or farmer's location
    const buyerLocation = {
      latitude: 40.7128, // Default NYC coordinates - should be from buyer's address
      longitude: -74.0060
    };

    // Find available drivers within radius
    const availableDrivers = await Driver.find({
      'availability.isAvailable': true,
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null }
    });

    if (availableDrivers.length === 0) {
      console.log('No available drivers found for order:', order._id);
      return;
    }

    // Calculate distances and find nearest driver
    const driversWithDistance = availableDrivers.map(driver => {
      const distance = calculateDistance(
        buyerLocation.latitude,
        buyerLocation.longitude,
        driver.location.latitude,
        driver.location.longitude
      );
      return { driver, distance };
    }).sort((a, b) => a.distance - b.distance);

    const nearestDriver = driversWithDistance[0];
    
    if (nearestDriver.distance > 50) { // 50km radius limit
      console.log('No drivers within acceptable range for order:', order._id);
      return;
    }

    // Update order status to ready_for_pickup
    order.status = 'ready_for_pickup';
    order.driver = {
      driverId: null, // Will be assigned when driver accepts
      assignedAt: null,
      status: 'pending_assignment'
    };
    await order.save();

    // Send notification to nearest drivers (top 3)
    const topDrivers = driversWithDistance.slice(0, 3);
    const io = global.io;
    
    if (io) {
      for (const { driver } of topDrivers) {
        io.emit('newOrderAvailable', {
          orderId: order._id,
          buyerLocation: buyerLocation,
          estimatedDistance: driver.distance,
          orderValue: order.totalAmount,
          message: 'New delivery order available!'
        });
      }
    }

    console.log(`Order ${order._id} marked as ready for pickup, ${topDrivers.length} drivers notified`);

  } catch (error) {
    console.error('Error in assignNearestDriver:', error);
    throw error;
  }
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  assignNearestDriver
};
