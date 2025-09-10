import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Cart() {
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
      setCartItems(response.data.items || []); // Extract items array from cart response
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
      await api.put(`/cart/update/${productId}`, { quantity: newQuantity });
      setCartItems(cartItems.map(item => 
        item.productId._id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      setCartItems(cartItems.filter(item => item.productId._id !== productId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart');
    }
  };

  const placeOrder = async () => {
    if (!deliveryAddress.trim()) {
      alert('Please enter delivery address');
      return;
    }

    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      setOrderLoading(true);
      
      const orderData = {
        items: cartItems.map(item => ({
          product: item.productId._id,
          quantity: item.quantity,
          price: item.productId.price
        })),
        deliveryAddress,
        paymentMethod,
        specialInstructions,
        totalAmount: getTotalAmount()
      };

      await api.post('/orders', orderData);
      await clearCart();
      alert('Order placed successfully!');
      
      // Reset form
      setDeliveryAddress('');
      setSpecialInstructions('');
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.productId.price * item.quantity), 0);
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
          {cartItems.map((item) => (
            <div key={item.productId._id} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-4">
                {/* Product Image */}
                {item.productId.image && (
                  <img
                    src={`http://localhost:5000${item.productId.image}`}
                    alt={item.productId.name}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                )}

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-400">
                    {item.productId.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {item.productId.description?.substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-green-400 font-semibold">
                      ₹{item.productId.price} per {item.productId.unit}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {item.productId.category}
                    </span>
                    {item.productId.organicCertified && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        🌿 Organic
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
          ))}
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
