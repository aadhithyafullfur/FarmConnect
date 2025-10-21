import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { showSuccess, showError, showWarning } from '../../utils/notifications';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      console.log('Cart response:', response.data); // Debug log
      if (response.data && Array.isArray(response.data.items)) {
        // Filter out items with null productId to prevent errors
        const validItems = response.data.items.filter(item => item.productId);
        setCartItems(validItems);
      } else if (response.data && typeof response.data === 'object') {
        // Handle single item case
        setCartItems([response.data].filter(item => item.productId));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    try {
      const response = await api.put(`/cart/update/${productId}`, { quantity: newQuantity });
      if (response.data && response.data.cart) {
        // Update with server response
        setCartItems(response.data.cart.items);
      } else {
        // Fallback to local update
        setCartItems(cartItems.map(item => 
          item.productId && item.productId._id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError('Failed to update quantity');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      setCartItems(cartItems.filter(item => item.productId && item.productId._id !== productId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      showError('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Failed to clear cart');
    }
  };

  const placeOrder = async () => {
    if (!deliveryAddress.trim()) {
      showWarning('Please enter delivery address');
      return;
    }

    if (cartItems.length === 0) {
      showWarning('Cart is empty');
      return;
    }

    try {
      setOrderLoading(true);
      
      const orderData = {
        items: cartItems.filter(item => item.productId).map(item => ({
          product: item.productId._id,
          quantity: item.quantity,
          price: item.productId.price
        })),
        deliveryAddress,
        paymentMethod,
        specialInstructions,
        totalAmount: getTotalAmount()
      };

      console.log('=== SENDING ORDER DATA ===');
      console.log('Order data:', JSON.stringify(orderData, null, 2));
      console.log('Cart items:', cartItems);
      console.log('==========================');

      const response = await api.post('/orders', orderData);
      await clearCart();
      
      // Show success modal with order details
      const orderDetails = response.data;
      
      showSuccess(`Order placed successfully! Order ID: ${orderDetails._id}`);
      
      // Reset form
      setDeliveryAddress('');
      setSpecialInstructions('');
      
      // Navigate to orders page after a short delay
      setTimeout(() => {
        navigate('/buyer/orders');
      }, 2000);
      
    } catch (error) {
      console.error('Error placing order:', error);
      showError('Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      if (!item.productId) return total;
      return total + (item.productId.price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Your cart is empty</h3>
        <p className="text-gray-400 mb-6">Add some fresh products to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
          Shopping Cart ({getTotalItems()} items)
        </h2>
        <button
          onClick={clearCart}
          className="px-4 py-2 text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg hover:bg-red-900/20 transition-all duration-200"
        >
          Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            // Add null check for productId
            if (!item.productId) {
              console.warn('Cart item has null productId:', item);
              return null;
            }
            
            return (
              <div key={item.productId._id} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative">
                    {item.productId.image ? (
                      <img
                        src={item.productId.image.startsWith('http') ? item.productId.image : `http://localhost:5003${item.productId.image}`}
                        alt={item.productId.name}
                      className="w-24 h-24 object-cover rounded-xl"
                      onError={(e) => {
                        if (item.productId.cropType) {
                          e.target.src = `/crops/${item.productId.cropType}.jpg`;
                        } else {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-24 h-24 flex items-center justify-center text-slate-400 bg-slate-800 rounded-xl"><span class="text-4xl">🌾</span></div>';
                        }
                      }}
                    />
                  ) : item.productId.cropType ? (
                    <img 
                      src={`/crops/${item.productId.cropType}.jpg`}
                      alt={item.productId.name}
                      className="w-24 h-24 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-24 h-24 flex items-center justify-center text-slate-400 bg-slate-800 rounded-xl"><span class="text-4xl">🌾</span></div>';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-slate-400 bg-slate-800 rounded-xl">
                      <span className="text-4xl">🌾</span>
                    </div>
                  )}
                  {item.productId.isFeatured && (
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs text-white px-2 py-1 rounded-full">Featured</span>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-400">
                    {item.productId.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {item.productId.description?.substring(0, 100)}...
                  </p>
                  
                  {/* Farmer Info */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center text-green-400">
                      👨‍🌾
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-400">{item.productId.farmerId?.name || 'Local Farmer'}</div>
                      <div className="text-xs text-gray-400">
                        {item.productId.farmerId?.location?.city}, {item.productId.farmerId?.location?.state}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    <span className="text-green-400 font-semibold">
                      ₹{item.productId.price} per {item.productId.unit}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {item.productId.category}
                    </span>
                    {item.productId.organicCertified && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        🌿 Organic
                      </span>
                    )}
                    {item.productId.inSeason && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                        🌞 In Season
                      </span>
                    )}
                    {item.productId.freshlyHarvested && (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                        ✨ Freshly Harvested
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium text-gray-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    ₹{(item.productId.price * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId._id)}
                    className="text-red-400 hover:text-red-300 text-sm mt-1 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 sticky top-4">
            <h3 className="text-xl font-semibold text-gray-200 mb-6">Order Summary</h3>
            
            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal ({getTotalItems()} items)</span>
                <span>₹{getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Fee</span>
                <span>₹50.00</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Platform Fee</span>
                <span>₹20.00</span>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold text-green-400">
                  <span>Total</span>
                  <span>₹{(getTotalAmount() + 50 + 20).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  placeholder="Enter your complete delivery address..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                  <option value="upi">UPI Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              <button
                onClick={placeOrder}
                disabled={orderLoading || !deliveryAddress.trim()}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl font-medium hover:from-green-400 hover:to-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-green-500/20"
              >
                {orderLoading ? 'Placing Order...' : 'Place Order'}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By placing an order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
