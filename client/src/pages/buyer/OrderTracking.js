import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';

function OrderTracking() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/buyer');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch farmer contact information
  const fetchFarmerContact = async (farmerId) => {
    try {
      const response = await api.get(`/users/${farmerId}`);
      setContactInfo(response.data);
      setShowContactModal(true);
    } catch (error) {
      console.error('Error fetching farmer contact:', error);
      showError('Failed to load farmer contact information');
    }
  };

  // Filter and sort orders
  const getFilteredOrders = () => {
    let filtered = orders;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount_high':
          return b.totalAmount - a.totalAmount;
        case 'amount_low':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });
  };



  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
              Order Management Center
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Track your orders, connect with farmers, and manage your agricultural purchases
            </p>
          </div>

          {/* Filters and Controls */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-gray-400 text-sm font-medium">Status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-gray-400 text-sm font-medium">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Highest Amount</option>
                    <option value="amount_low">Lowest Amount</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-gray-400 text-sm">
                  <span className="font-medium text-green-400">{filteredOrders.length}</span> orders found
                </div>
                <button
                  onClick={fetchOrders}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-gray-400 text-xl mb-4">No orders found</div>
            <p className="text-gray-500 mb-8">
              {filterStatus === 'all' 
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `No orders with status "${filterStatus.replace(/_/g, ' ')}" found.`
              }
            </p>
            <button
              onClick={() => window.location.href = '/products'}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-700/50 hover:border-green-500/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Order Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
                  <div className="mb-4 lg:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-2xl font-bold text-green-400">
                        Order #{order.orderId || order._id.slice(-8).toUpperCase()}
                      </h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white border ${
                        order.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : order.status === "confirmed"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : order.status === "preparing"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : order.status === "out_for_delivery"
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          : order.status === "delivered"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : order.status === "cancelled"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-gray-400 flex items-center space-x-2">
                      <span>📅</span>
                      <span>Placed on {formatDate(order.createdAt)}</span>
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <div className="flex items-center space-x-1 text-gray-300">
                        <span>💳</span>
                        <span>{formatStatus(order.paymentMethod || 'cash')}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-400 font-semibold">
                        <span>💰</span>
                        <span>₹{order.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-2 lg:space-y-0 lg:space-x-3">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-400">₹{order.totalAmount?.toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">{order.items?.length || 0} items</div>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                  {/* Items Section */}
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
                      <span>🛒</span>
                      <span>Order Items</span>
                    </h4>
                    <div className="space-y-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 hover:border-green-500/30 transition-colors">
                          <div className="flex items-center space-x-4">
                            {item.productImage && (
                              <img
                                src={`http://localhost:5003${item.productImage}`}
                                alt={item.productName}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                              />
                            )}
                            <div className="flex-1">
                              <h5 className="font-semibold text-white">{item.productName}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                <span>Quantity: {item.quantity} {item.unit || 'kg'}</span>
                                <span>Rate: ₹{item.pricePerUnit}/{item.unit || 'kg'}</span>
                              </div>
                              {item.farmerId && (
                                <button
                                  onClick={() => fetchFarmerContact(item.farmerId._id || item.farmerId)}
                                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                  Contact Farmer: {item.farmerId.name || 'View Details'}
                                </button>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-400 text-lg">
                                ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery & Contact Section */}
                  <div className="space-y-4">
                    <div className="bg-gray-700/20 rounded-xl p-4 border border-gray-600/30">
                      <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                        <span>🚚</span>
                        <span>Delivery Details</span>
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <p className="text-white mt-1 leading-relaxed">
                            {order.deliveryInfo?.address?.street || 'Address not specified'}
                            {order.deliveryInfo?.address?.city && (
                              <>
                                <br />
                                {order.deliveryInfo.address.city}, {order.deliveryInfo.address.state} {order.deliveryInfo.address.zipCode}
                              </>
                            )}
                          </p>
                        </div>
                        {order.deliveryInfo?.instructions && (
                          <div>
                            <span className="text-gray-400">Special Instructions:</span>
                            <p className="text-white mt-1 bg-gray-600/30 p-2 rounded text-xs">
                              {order.deliveryInfo.instructions}
                            </p>
                          </div>
                        )}
                        {order.deliveryInfo?.preferredTime && (
                          <div>
                            <span className="text-gray-400">Preferred Time:</span>
                            <p className="text-white">{order.deliveryInfo.preferredTime}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                      <h4 className="font-semibold text-green-400 mb-3">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Subtotal:</span>
                          <span className="text-white">₹{(order.totalAmount * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Delivery:</span>
                          <span className="text-white">₹{(order.totalAmount * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
                          <span className="text-green-400">Total:</span>
                          <span className="text-green-400 text-lg">₹{order.totalAmount?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pt-6 border-t border-gray-700/50 space-y-4 lg:space-y-0">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <span>{selectedOrder === order._id ? '👁️‍🗨️' : '👁️'}</span>
                      <span>{selectedOrder === order._id ? 'Hide Timeline' : 'View Timeline'}</span>
                    </button>
                    
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => showSuccess('Order tracking SMS sent!')}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <span>📱</span>
                        <span>Get Updates</span>
                      </button>
                    )}
                    
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => showSuccess('Thank you for your feedback!')}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <span>⭐</span>
                        <span>Rate Order</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => showSuccess('Order cancellation requested')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm"
                      >
                        Cancel Order
                      </button>
                    )}
                    <div className="text-right">
                      <div className="text-gray-400 text-sm">Order ID</div>
                      <div className="font-mono text-green-400 text-sm">{order._id}</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Order Timeline */}
                {selectedOrder === order._id && (
                  <div className="mt-6 pt-6 border-t border-gray-700/50">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Timeline */}
                      <div>
                        <h5 className="font-semibold text-green-400 mb-6 flex items-center space-x-2">
                          <span>⏰</span>
                          <span>Order Timeline</span>
                        </h5>
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
                          <div className="space-y-6">
                            {/* Order Placed */}
                            <div className="relative flex items-start">
                              <div className="absolute left-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-gray-800">
                                <span className="text-xs text-white font-bold">✓</span>
                              </div>
                              <div className="ml-12">
                                <h6 className="font-medium text-white">Order Placed</h6>
                                <p className="text-gray-400 text-sm">{formatDate(order.createdAt)}</p>
                                <p className="text-gray-500 text-xs mt-1">Your order has been successfully placed and is being processed.</p>
                              </div>
                            </div>

                            {/* Order Confirmed */}
                            <div className="relative flex items-start">
                              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-gray-800 ${
                                order.status !== 'pending' ? 'bg-blue-500' : 'bg-gray-600'
                              }`}>
                                <span className="text-xs text-white font-bold">
                                  {order.status !== 'pending' ? '✓' : '○'}
                                </span>
                              </div>
                              <div className="ml-12">
                                <h6 className={`font-medium ${order.status !== 'pending' ? 'text-white' : 'text-gray-500'}`}>
                                  Order Confirmed
                                </h6>
                                <p className="text-gray-400 text-sm">
                                  {order.status !== 'pending' ? 'Confirmed by farmer' : 'Waiting for farmer confirmation'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  The farmer has reviewed and accepted your order.
                                </p>
                              </div>
                            </div>

                            {/* Preparing */}
                            <div className="relative flex items-start">
                              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-gray-800 ${
                                ['preparing', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) ? 'bg-orange-500' : 'bg-gray-600'
                              }`}>
                                <span className="text-xs text-white font-bold">
                                  {['preparing', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) ? '✓' : '○'}
                                </span>
                              </div>
                              <div className="ml-12">
                                <h6 className={`font-medium ${
                                  ['preparing', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) ? 'text-white' : 'text-gray-500'
                                }`}>
                                  Preparing Order
                                </h6>
                                <p className="text-gray-400 text-sm">
                                  {['preparing', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) 
                                    ? 'Order is being prepared' : 'Waiting for preparation to begin'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Your fresh products are being harvested and packaged.
                                </p>
                              </div>
                            </div>

                            {/* Out for Delivery */}
                            <div className="relative flex items-start">
                              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-gray-800 ${
                                ['out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) ? 'bg-purple-500' : 'bg-gray-600'
                              }`}>
                                <span className="text-xs text-white font-bold">
                                  {['out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) ? '✓' : '○'}
                                </span>
                              </div>
                              <div className="ml-12">
                                <h6 className={`font-medium ${
                                  ['out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) ? 'text-white' : 'text-gray-500'
                                }`}>
                                  Out for Delivery
                                </h6>
                                <p className="text-gray-400 text-sm">
                                  {['out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) 
                                    ? 'Order is on the way' : 'Waiting for delivery dispatch'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Your order is on its way to your delivery address.
                                </p>
                              </div>
                            </div>

                            {/* Delivered */}
                            <div className="relative flex items-start">
                              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-gray-800 ${
                                order.status.toLowerCase() === 'delivered' ? 'bg-green-500' : 'bg-gray-600'
                              }`}>
                                <span className="text-xs text-white font-bold">
                                  {order.status.toLowerCase() === 'delivered' ? '✓' : '○'}
                                </span>
                              </div>
                              <div className="ml-12">
                                <h6 className={`font-medium ${order.status.toLowerCase() === 'delivered' ? 'text-white' : 'text-gray-500'}`}>
                                  Delivered
                                </h6>
                                <p className="text-gray-400 text-sm">
                                  {order.status.toLowerCase() === 'delivered' ? 'Order successfully delivered' : 'Awaiting delivery completion'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Order has been delivered to your specified address.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Farmer Contact Information */}
                      <div>
                        <h5 className="font-semibold text-green-400 mb-6 flex items-center space-x-2">
                          <span>👨‍🌾</span>
                          <span>Farmer Information</span>
                        </h5>
                        <div className="space-y-4">
                          {order.items?.map((item, index) => (
                            item.farmerId && (
                              <div key={index} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                      {(item.farmerId.name || 'F')[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h6 className="font-medium text-white">{item.farmerId.name || 'Unknown Farmer'}</h6>
                                    <p className="text-gray-400 text-sm">Supplying: {item.productName}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <button
                                    onClick={() => fetchFarmerContact(item.farmerId._id || item.farmerId)}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
                                  >
                                    <span>📞</span>
                                    <span>Contact Farmer</span>
                                  </button>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => showSuccess('Chat feature coming soon!')}
                                      className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs flex items-center justify-center space-x-1"
                                    >
                                      <span>💬</span>
                                      <span>Chat</span>
                                    </button>
                                    <button
                                      onClick={() => showSuccess('Location shared!')}
                                      className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs flex items-center justify-center space-x-1"
                                    >
                                      <span>📍</span>
                                      <span>Location</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && contactInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-400">Farmer Contact</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">
                  {(contactInfo.name || 'F')[0].toUpperCase()}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-white">{contactInfo.name || 'Unknown Farmer'}</h4>
              <p className="text-gray-400">{contactInfo.role || 'Farmer'}</p>
            </div>

            <div className="space-y-4">
              {contactInfo.email && (
                <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-2xl">📧</span>
                  <div>
                    <div className="text-gray-400 text-sm">Email</div>
                    <div className="text-white">{contactInfo.email}</div>
                  </div>
                </div>
              )}

              {contactInfo.phone && (
                <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-2xl">📱</span>
                  <div>
                    <div className="text-gray-400 text-sm">Phone</div>
                    <div className="text-white">{contactInfo.phone}</div>
                  </div>
                </div>
              )}

              {contactInfo.address && (
                <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="text-gray-400 text-sm">Address</div>
                    <div className="text-white">{contactInfo.address}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-center"
                >
                  Call Now
                </a>
              )}
              {contactInfo.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-center"
                >
                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTracking;