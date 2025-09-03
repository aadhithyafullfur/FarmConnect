const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Create new order
const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, specialInstructions, totalAmount } = req.body;
    const buyerId = req.user.id;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

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
        farmer: product.farmer
      });

      calculatedTotal += (item.price || product.price) * item.quantity;

      // Update product quantity
      product.quantity -= item.quantity;
      await product.save();
    }

    // Create order
    const order = new Order({
      buyer: buyerId,
      items: orderItems,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cod',
      specialInstructions,
      totalAmount: calculatedTotal,
      status: 'pending'
    });

    await order.save();

    // Clear user's cart
    await Cart.findOneAndDelete({ user: buyerId });

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('buyer', 'name email')
      .populate('items.product', 'name price unit image')
      .populate('items.farmer', 'name email');

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
            buyerName: populatedOrder.buyer.name,
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
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get buyer's orders
const getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    const orders = await Order.find({ buyer: buyerId })
      .populate('buyer', 'name email')
      .populate('items.product', 'name price unit image')
      .populate('items.farmer', 'name email')
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
    const farmerId = req.user.id;
    
    const orders = await Order.find({ 'items.farmer': farmerId })
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name price unit image')
      .populate('items.farmer', 'name email')
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
    const userId = req.user.id;

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
    const farmerId = req.user.id;

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
    const buyerId = req.user.id;

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

module.exports = {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};
