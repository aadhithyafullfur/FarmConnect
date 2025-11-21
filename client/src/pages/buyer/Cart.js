import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { showError, showSuccess, showWarning } from '../../utils/notifications';
import Navbar from '../../components/Navbar';

function Cart() {
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const normalizeCartItems = useCallback((raw) => {
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

    return items
      .filter((it) => it && (it.productId || it.product))
      .map((it) => {
        const product = it.productId || it.product;
        return {
          id: it._id || it.id || product._id || product.id || `${product?.name || 'prod'}_${Math.random()}`,
          product,
          quantity: Number.isFinite(it.quantity) ? it.quantity : Number(it.qty) || 1,
        };
      });
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
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
  }, [normalizeCartItems]);

  useEffect(() => {
    isMounted.current = true;
    fetchCart();
    return () => {
      isMounted.current = false;
    };
  }, [fetchCart]);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((acc, it) => {
      const price = Number(it.product?.price) || 0;
      const qty = Number(it.quantity) || 0;
      return acc + price * qty;
    }, 0);
    const itemsCount = cartItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const deliveryFee = 0;
    const platformFee = itemsCount > 0 ? 20 : 0;
    const total = subtotal + deliveryFee + platformFee;
    return { subtotal, itemsCount, deliveryFee, platformFee, total };
  }, [cartItems]);

  const buildImageSrc = (img) => {
    if (!img) return null;
    try {
      const url = new URL(img, window.location.origin);
      return url.href;
    } catch (e) {
      return `${process.env.REACT_APP_API_BASE || 'http://localhost:5003'}${img}`;
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      return removeFromCart(cartItemId);
    }

    const prevItems = [...cartItems];
    const updated = prevItems.map((it) => (it.id === cartItemId ? { ...it, quantity: newQuantity } : it));
    setCartItems(updated);

    try {
      const response = await api.put(`/cart/update/${cartItemId}`, { quantity: newQuantity });
      const data = response?.data;
      if (data) {
        const parsed = normalizeCartItems(data.items ? data : data.cart ? data.cart : data);
        if (parsed.length) setCartItems(parsed);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError('Could not update quantity. Reverting.');
      setCartItems(prevItems);
    }
  };

  const removeFromCart = async (cartItemId) => {
    const prevItems = [...cartItems];
    setCartItems(prevItems.filter((it) => it.id !== cartItemId));

    try {
      const response = await api.delete(`/cart/remove/${cartItemId}`);
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

      const validItems = cartItems.every(it => {
        const productId = it.product?._id || it.product?.id || it.productId;
        const price = it.product?.price || it.price;
        const quantity = it.quantity;
        return productId && price && quantity > 0;
      });

      if (!validItems) {
        showError('Invalid cart data. Please refresh and try again.');
        setOrderLoading(false);
        return;
      }

      const orderData = {
        items: cartItems.map((it) => ({
          product: it.product?._id || it.product?.id || it.productId,
          quantity: it.quantity,
          price: it.product?.price || it.price
        })),
        deliveryAddress,
        paymentMethod: paymentMethod || 'cod',
        specialInstructions,
        totalAmount: totals.total,
      };

      console.log('Placing order with data:', JSON.stringify(orderData, null, 2));
      const response = await api.post('/orders', orderData);
      const orderDetails = response?.data;

      try {
        await api.delete('/cart/clear');
      } catch (e) {
        // ignore
      }

      showSuccess(`Order placed successfully! Order ID: ${orderDetails?._id || orderDetails?.id || ''}`);

      setDeliveryAddress('');
      setSpecialInstructions('');
      setPaymentMethod('cod');
      setCartItems([]);

      navigate('/buyer/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to place order. Please try again.';
      showError(errorMsg);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
              <svg className="w-8 h-8 text-emerald-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-slate-400">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Your cart is empty</h3>
            <p className="text-slate-400 mb-6">Add some fresh products to get started</p>
            <button
              onClick={() => navigate('/buyer')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between bg-gradient-to-r from-slate-800/40 to-slate-900/40 p-6 rounded-2xl border border-slate-700/50">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Your Shopping Cart</h1>
            <p className="text-slate-400 mt-2 text-base">You have <span className="text-emerald-400 font-semibold">{totals.itemsCount} item{totals.itemsCount !== 1 ? 's' : ''}</span> ready to order</p>
          </div>
          <button
            onClick={clearCart}
            className="px-6 py-3 text-red-400 hover:text-red-300 border border-red-500/40 hover:bg-red-500/15 rounded-xl transition-all font-semibold text-sm hover:shadow-lg hover:shadow-red-500/20"
            aria-label="Clear cart"
          >
            Clear All
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.product;
              const imgSrc = buildImageSrc(product?.image);

              return (
                <div key={item.id} className="bg-gradient-to-br from-slate-800 to-slate-850 rounded-xl border border-slate-700/60 hover:border-emerald-500/60 transition-all duration-300 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-lg hover:shadow-emerald-500/10">
                  {/* Product Image */}
                  <div className="w-32 flex-shrink-0">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={product?.name || 'product'}
                        className="w-32 h-32 object-cover rounded-xl border border-slate-600 shadow-lg"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : product?.cropType ? (
                      <img
                        src={`/crops/${product.cropType}.jpg`}
                        alt={product?.name}
                        className="w-32 h-32 object-cover rounded-xl border border-slate-600 shadow-lg"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center text-slate-600 bg-slate-700 rounded-xl border border-slate-600 shadow-lg">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{product?.name}</h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product?.description}</p>

                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <div className="flex items-center gap-2 bg-slate-700/40 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                        </svg>
                        <span className="text-sm text-slate-300 font-medium">{product?.farmerId?.name || 'Local Farmer'}</span>
                      </div>
                      {product?.organicCertified && (
                        <span className="px-3 py-1.5 bg-green-500/25 text-green-300 rounded-lg text-xs border border-green-500/40 font-semibold">✓ Organic</span>
                      )}
                      <span className="px-3 py-1.5 bg-slate-700/40 text-slate-300 rounded-lg text-xs font-medium">{product?.category}</span>
                    </div>

                    <div className="text-emerald-400 font-bold text-lg">₹{Number(product?.price || 0).toFixed(0)}/{product?.unit}</div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-end gap-4 w-full sm:w-auto">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-slate-700/60 rounded-xl p-2 border border-slate-600/50">
                      <button
                        onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                        className="w-9 h-9 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-emerald-200 transition-all duration-200 flex items-center justify-center font-bold"
                        aria-label={`Decrease quantity of ${product?.name}`}
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-bold text-white text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                        className="w-9 h-9 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-emerald-200 transition-all duration-200 flex items-center justify-center font-bold"
                        aria-label={`Increase quantity of ${product?.name}`}
                      >
                        +
                      </button>
                    </div>

                    {/* Price & Remove */}
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">₹{(Number(product?.price || 0) * Number(item.quantity)).toFixed(0)}</div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs mt-2 transition-colors font-medium hover:underline"
                        aria-label={`Remove ${product?.name} from cart`}
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-7 sticky top-24 shadow-2xl shadow-slate-900/50">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent mb-7">Order Summary</h3>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-7 pb-7 border-b border-slate-700/50">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sm">Subtotal</span>
                  <span className="text-white font-semibold">₹{totals.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sm">Delivery Fee</span>
                  <span className="text-green-400 font-semibold text-sm">Free ✓</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sm">Platform Fee</span>
                  <span className="text-white font-semibold">₹{totals.platformFee.toFixed(0)}</span>
                </div>

                <div className="flex justify-between items-center text-lg mt-4 pt-3 border-t border-slate-700/30">
                  <span className="font-bold text-white">Total Amount</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">₹{totals.total.toFixed(0)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-white mb-2.5">Delivery Address <span className="text-red-400">*</span></label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/60 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm font-medium resize-none"
                  placeholder="Enter your complete delivery address..."
                />
              </div>

              {/* Payment Method */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-white mb-2.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/60 rounded-xl text-white focus:border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm font-medium"
                >
                  <option value="cod">💵 Cash on Delivery</option>
                  <option value="online">💳 Online Payment</option>
                  <option value="upi">📱 UPI Payment</option>
                </select>
              </div>

              {/* Special Instructions */}
              <div className="mb-7">
                <label className="block text-sm font-bold text-white mb-2.5">Special Instructions <span className="text-slate-500 font-normal text-xs">(Optional)</span></label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/60 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm font-medium resize-none"
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              {/* Place Order Button */}
              <button
                onClick={placeOrder}
                disabled={orderLoading || !deliveryAddress.trim()}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-xl shadow-emerald-600/40 hover:shadow-emerald-600/60 disabled:shadow-none"
                aria-disabled={orderLoading || !deliveryAddress.trim()}
              >
                {orderLoading ? 'Placing Order...' : 'Confirm Order'}
              </button>

              <div className="text-center mt-5">
                <p className="text-xs text-slate-500 leading-relaxed">By placing an order, you agree to our <span className="text-emerald-400 cursor-pointer hover:underline">terms and conditions</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
