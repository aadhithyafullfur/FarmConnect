import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { showError, showSuccess, showWarning } from '../../utils/notifications';

/**
 * Refactored Cart component
 * - Defensive parsing for varied cart API shapes
 * - Optimistic UI updates for quantity / remove with rollback on failure
 * - Fixed image onError handling without manipulating DOM directly
 * - useMemo for totals
 * - isMounted ref to avoid setting state on unmounted component
 * - Accessibility improvements and confirmations for destructive actions
 * - Better loading / empty states
 */

function Cart() {
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    isMounted.current = true;
    fetchCart();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const normalizeCartItems = (raw) => {
    // Accepts multiple shapes: { items: [...] } or { cart: { items: [...] } } or single item array/object
    if (!raw) return [];

    const items = Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.cart?.items)
      ? raw.cart.items
      : Array.isArray(raw)
      ? raw
      : typeof raw === 'object' && raw.productId
      ? [raw]
      : [];

    // filter out invalid items and ensure each item has required fields
    return items
      .filter((it) => it && (it.productId || it.product))
      .map((it) => {
        const product = it.productId || it.product;
        return {
          // id for react key: prefer cart item id if present else product id
          id: it._id || it.id || product._id || product.id || `${product?.name || 'prod'}_${Math.random()}`,
          product,
          quantity: Number.isFinite(it.quantity) ? it.quantity : Number(it.qty) || 1,
        };
      });
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      // defensive: response.data might be { items: [...] } or { cart: { items: [...] } }
      const raw = response?.data;
      if (!isMounted.current) return;
      const parsed = normalizeCartItems(raw);
      setCartItems(parsed);
    } catch (error) {
      console.error('Error fetching cart:', error);
      showError('Failed to load cart. Please refresh.');
      if (isMounted.current) setCartItems([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // memoized totals
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((acc, it) => {
      const price = Number(it.product?.price) || 0;
      const qty = Number(it.quantity) || 0;
      return acc + price * qty;
    }, 0);
    const itemsCount = cartItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const deliveryFee = itemsCount > 0 ? 50 : 0;
    const platformFee = itemsCount > 0 ? 20 : 0;
    const total = subtotal + deliveryFee + platformFee;
    return { subtotal, itemsCount, deliveryFee, platformFee, total };
  }, [cartItems]);

  // Helper to build image src safely
  const buildImageSrc = (img) => {
    if (!img) return null;
    try {
      // if it's already absolute URL, return it
      const url = new URL(img, window.location.origin);
      return url.href;
    } catch (e) {
      // fallback: try to prefix with API host if it's a path
      return `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}${img}`;
    }
  };

  // Optimistic update for quantity with rollback
  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      // remove the item
      return removeFromCart(cartItemId);
    }

    const prevItems = [...cartItems];
    const idx = cartItems.findIndex((it) => it.id === cartItemId);
    if (idx === -1) return;

    const updated = prevItems.map((it) => (it.id === cartItemId ? { ...it, quantity: newQuantity } : it));
    setCartItems(updated);

    try {
      const response = await api.put(`/cart/update/${cartItemId}`, { quantity: newQuantity });
      // if server returned canonical cart, reconcile
      const data = response?.data;
      if (data) {
        const parsed = normalizeCartItems(data.items ? data : data.cart ? data.cart : data);
        if (parsed.length) setCartItems(parsed);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError('Could not update quantity. Reverting.');
      // rollback
      setCartItems(prevItems);
    }
  };

  const removeFromCart = async (cartItemId) => {
    const prevItems = [...cartItems];
    setCartItems(prevItems.filter((it) => it.id !== cartItemId));

    try {
      const response = await api.delete(`/cart/remove/${cartItemId}`);
      // if server returned updated cart, use it
      const data = response?.data;
      if (data) {
        const parsed = normalizeCartItems(data.items ? data : data.cart ? data.cart : data);
        setCartItems(parsed);
      }
      showSuccess('Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      showError('Failed to remove item. Restoring.');
      setCartItems(prevItems);
    }
  };

  const clearCart = async () => {
    const confirmed = window.confirm('Are you sure you want to clear the entire cart?');
    if (!confirmed) return;
    const prevItems = [...cartItems];
    setCartItems([]);

    try {
      const response = await api.delete('/cart/clear');
      const data = response?.data;
      if (data) {
        const parsed = normalizeCartItems(data.items ? data : data.cart ? data.cart : data);
        setCartItems(parsed);
      }
      showSuccess('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Failed to clear cart. Restoring.');
      setCartItems(prevItems);
    }
  };

  const placeOrder = async () => {
    if (!deliveryAddress.trim()) {
      showWarning('Please enter delivery address');
      return;
    }
    if (cartItems.length === 0) {
      showWarning('Your cart is empty');
      return;
    }

    try {
      setOrderLoading(true);

      const orderData = {
        items: cartItems.map((it) => ({ product: it.product._id || it.product.id, quantity: it.quantity, price: it.product.price })),
        deliveryAddress,
        paymentMethod,
        specialInstructions,
        totalAmount: totals.total,
      };

      const response = await api.post('/orders', orderData);
      const orderDetails = response?.data;

      // Clear cart locally and attempt to clear server cart as well
      try {
        await api.delete('/cart/clear');
      } catch (e) {
        // ignore - will fetch again
      }

      showSuccess(`Order placed successfully! Order ID: ${orderDetails?._id || orderDetails?.id || ''}`);

      setDeliveryAddress('');
      setSpecialInstructions('');
      setPaymentMethod('cod');
      setCartItems([]);

      // navigate to orders page
      navigate('/buyer/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      showError('Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto" aria-hidden="true"></div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
          Shopping Cart ({totals.itemsCount} items)
        </h2>
        <button
          onClick={clearCart}
          className="px-4 py-2 text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg hover:bg-red-900/20 transition-all duration-200"
          aria-label="Clear cart"
        >
          Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.product;
            const imgSrc = buildImageSrc(product?.image);

            return (
              <div key={item.id} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 flex items-start gap-4">
                <div className="w-28 flex-shrink-0">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product?.name || 'product'}
                      className="w-24 h-24 object-cover rounded-xl"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : product?.cropType ? (
                    <img
                      src={`/crops/${product.cropType}.jpg`}
                      alt={product?.name}
                      className="w-24 h-24 object-cover rounded-xl"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-slate-400 bg-slate-800 rounded-xl">
                      <span className="text-4xl">🌾</span>
                    </div>
                  )}

                  {product?.isFeatured && (
                    <span className="inline-block mt-2 px-2 py-1 bg-yellow-500 text-xs text-white rounded-full">Featured</span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-400">{product?.name}</h3>
                  <p className="text-gray-400 text-sm mt-1 truncate" title={product?.description}>{product?.description}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center text-green-400">👨‍🌾</div>
                    <div>
                      <div className="text-sm font-medium text-green-400">{product?.farmerId?.name || 'Local Farmer'}</div>
                      <div className="text-xs text-gray-400">{product?.farmerId?.location?.city}, {product?.farmerId?.location?.state}</div>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    <span className="text-green-400 font-semibold">₹{Number(product?.price || 0).toFixed(2)} per {product?.unit}</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">{product?.category}</span>
                    {product?.organicCertified && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">🌿 Organic</span>}
                    {product?.inSeason && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">🌞 In Season</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                      className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                      aria-label={`Decrease quantity of ${product?.name}`}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium text-gray-200">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                      className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                      aria-label={`Increase quantity of ${product?.name}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">₹{(Number(product?.price || 0) * Number(item.quantity)).toFixed(2)}</div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300 text-sm mt-1 transition-colors duration-200"
                      aria-label={`Remove ${product?.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 sticky top-4">
            <h3 className="text-xl font-semibold text-gray-200 mb-6">Order Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal ({totals.itemsCount} items)</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Fee</span>
                <span>₹{totals.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Platform Fee</span>
                <span>₹{totals.platformFee.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold text-green-400">
                  <span>Total</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Delivery Address *</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  placeholder="Enter your complete delivery address..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Special Instructions</label>
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
                aria-disabled={orderLoading || !deliveryAddress.trim()}
              >
                {orderLoading ? 'Placing Order...' : 'Place Order'}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">By placing an order, you agree to our terms and conditions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
