import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showSuccess, showError } from '../../utils/notifications';
import Navbar from '../../components/Navbar';

function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/buyer');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const cancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: 'cancelled' } : order
      ));
      showSuccess('Order cancelled successfully');
      setCancellingOrderId(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError('Failed to cancel order');
      setCancellingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    return filter === 'all' || order.status === filter;
  });

  const statusTabs = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Ready', value: 'ready' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'preparing': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'ready': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'shipped': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
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
            <p className="text-slate-400">Loading your orders...</p>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">My Orders</h1>
          <p className="text-slate-400 mt-2">Total orders: <span className="text-emerald-400 font-semibold">{orders.length}</span></p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === tab.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-2 text-sm opacity-75">
                  ({orders.filter(o => o.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10" />
              </svg>
            </div>
            <p className="text-slate-400">No orders found for this status</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                  className="w-full px-6 py-4 hover:bg-slate-700/30 transition-colors text-left flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-white">Order #{order._id?.slice(-8).toUpperCase()}</p>
                        <p className="text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold text-emerald-400 text-lg">₹{Number(order.totalAmount || 0).toFixed(0)}</p>
                    <p className="text-xs text-slate-400">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
                  </div>
                  <svg
                    className={`w-6 h-6 text-slate-400 transform transition-transform ${
                      expandedOrder === order._id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Order Details (Expanded) */}
                {expandedOrder === order._id && (
                  <div className="border-t border-slate-700 px-6 py-4 space-y-6 bg-slate-700/30">
                    {/* Delivery Details */}
                    <div>
                      <h4 className="font-semibold text-white mb-2">Delivery Details</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                        <div>
                          <p className="text-xs text-slate-500">Delivery Address</p>
                          <p className="text-slate-200">{order.deliveryAddress}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Payment Method</p>
                          <p className="text-slate-200 capitalize">{order.paymentMethod || 'Cash on Delivery'}</p>
                        </div>
                        {order.specialInstructions && (
                          <div>
                            <p className="text-xs text-slate-500">Special Instructions</p>
                            <p className="text-slate-200">{order.specialInstructions}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-white mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="bg-slate-800/50 rounded-lg p-4 flex gap-4">
                            <div className="w-16 h-16 flex-shrink-0">
                              {item.product?.image ? (
                                <img
                                  src={item.product.image}
                                  alt={item.product?.name}
                                  className="w-full h-full object-cover rounded-lg border border-slate-600"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-white">{item.product?.name}</h5>
                              <p className="text-sm text-slate-400">{item.product?.category}</p>
                              <div className="flex justify-between mt-2">
                                <p className="text-slate-300">
                                  {item.quantity} x ₹{Number(item.price || 0).toFixed(0)}
                                </p>
                                <p className="font-semibold text-emerald-400">₹{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="bg-gradient-to-r from-emerald-600/10 to-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                      <div className="space-y-2">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-sm">Items Subtotal</span>
                          <span className="text-sm">₹{(Number(order.totalAmount || 0) - 20).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-sm">Platform Fee</span>
                          <span className="text-sm">₹20</span>
                        </div>
                        <div className="border-t border-emerald-500/20 pt-3 mt-3 flex justify-between">
                          <span className="font-bold text-white">Order Total</span>
                          <span className="text-xl font-bold text-emerald-400">₹{Number(order.totalAmount || 0).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => cancelOrder(order._id)}
                          disabled={cancellingOrderId === order._id}
                          className="flex-1 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors font-medium disabled:opacity-50"
                        >
                          {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      <button className="flex-1 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerOrders;
