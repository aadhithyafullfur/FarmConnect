const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate({
        path: 'items.productId',
        populate: {
          path: 'farmerId',
          select: 'name farmName location'
        }
      });

    if (!cart) {
      return res.json({
        items: [],
        totalAmount: 0,
        totalItems: 0
      });
    }

    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Server error while fetching cart' });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, notes = '' } = req.body;
    const userId = req.user.id;

    console.log('Cart add request - userId:', userId, 'productId:', productId, 'quantity:', quantity);

    // Validate request body
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity. Must be a positive number.' });
    }

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.status !== 'available') {
      return res.status(400).json({ error: 'Product is not available' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      cart = new Cart({ userId: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].notes = notes || cart.items[existingItemIndex].notes;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        priceAtTime: product.discountedPrice || product.price,
        notes
      });
    }

    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'items.productId',
      populate: {
        path: 'farmerId',
        select: 'name farmName location'
      }
    });

    res.json({
      message: 'Item added to cart successfully',
      cart
    });

  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Server error while adding to cart' });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, notes } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Validate product stock
    const product = await Product.findById(item.productId);
    if (product && product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    item.quantity = quantity;
    if (notes !== undefined) item.notes = notes;

    await cart.save();

    await cart.populate({
      path: 'items.productId',
      populate: {
        path: 'farmerId',
        select: 'name farmName location'
      }
    });

    res.json({
      message: 'Cart item updated successfully',
      cart
    });

  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ error: 'Server error while updating cart item' });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items.id(itemId).remove();
    await cart.save();

    await cart.populate({
      path: 'items.productId',
      populate: {
        path: 'farmerId',
        select: 'name farmName location'
      }
    });

    res.json({
      message: 'Item removed from cart successfully',
      cart
    });

  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ error: 'Server error while removing from cart' });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalAmount: 0, totalItems: 0 },
      { new: true }
    );

    res.json({ message: 'Cart cleared successfully' });

  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: 'Server error while clearing cart' });
  }
};

module.exports = exports;
