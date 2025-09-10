import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

// Simple toast component for the dashboard
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-400';
      case 'error':
        return 'bg-red-500/90 border-red-400';
      default:
        return 'bg-blue-500/90 border-blue-400';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border backdrop-blur-xl text-white shadow-lg ${getToastStyles()}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

function DriverDashboard() {
  const { user } = useContext(AuthContext);
  const [driverData, setDriverData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDriverData();
    fetchOrders();
    fetchEarnings();
  }, []);

  const fetchDriverData = async () => {
    try {
      const response = await api.get('/drivers/profile');
      setDriverData(response.data);
      setIsAvailable(response.data.isAvailable || false);
    } catch (err) {
      console.error('Error fetching driver data:', err);
      setError('Failed to load driver profile');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/drivers/orders');
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/drivers/earnings');
      setEarnings(response.data.earnings || {
        today: 0,
        week: 0,
        month: 0,
        total: 0
      });
    } catch (err) {
      console.error('Error fetching earnings:', err);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await api.put('/drivers/availability', {
        isAvailable: !isAvailable
      });
      setIsAvailable(response.data.isAvailable);
      setNotification({
        type: 'success',
        message: `You are now ${response.data.isAvailable ? 'available' : 'unavailable'} for deliveries`
      });
    } catch (err) {
      console.error('Error updating availability:', err);
      setNotification({
        type: 'error',
        message: 'Failed to update availability'
      });
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await api.put(`/drivers/orders/${orderId}/accept`);
      setNotification({
        type: 'success',
        message: 'Order accepted successfully'
      });
      fetchOrders(); // Refresh orders
    } catch (err) {
      console.error('Error accepting order:', err);
      setNotification({
        type: 'error',
        message: 'Failed to accept order'
      });
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/drivers/orders/${orderId}/status`, { status });
      setNotification({
        type: 'success',
        message: `Order status updated to ${status}`
      });
      fetchOrders(); // Refresh orders
      if (status === 'delivered') {
        fetchEarnings(); // Refresh earnings when order is completed
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setNotification({
        type: 'error',
        message: 'Failed to update order status'
      });
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'accepted': return 'text-blue-400 bg-blue-400/10';
      case 'in_transit': return 'text-purple-400 bg-purple-400/10';
      case 'delivered': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 p-6">
      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.firstName || 'Driver'}!
              </h1>
              <p className="text-gray-300">
                Manage your deliveries and track your earnings
              </p>
            </div>
            
            {/* Availability Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Availability:</span>
              <button
                onClick={toggleAvailability}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 ${
                  isAvailable ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                    isAvailable ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`font-medium ${isAvailable ? 'text-green-400' : 'text-gray-400'}`}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today's Earnings</p>
                <p className="text-2xl font-bold text-green-400">₹{earnings.today}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-blue-400">₹{earnings.week}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-purple-400">₹{earnings.month}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-yellow-400">₹{earnings.total}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-2">Delivery Orders</h2>
            <p className="text-gray-400">Manage your assigned deliveries</p>
          </div>

          <div className="divide-y divide-gray-700/50">
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No orders available</h3>
                <p className="text-gray-400">
                  {isAvailable 
                    ? "You're available for deliveries. New orders will appear here." 
                    : "Set yourself as available to receive delivery orders."
                  }
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">Order #{order.orderNumber || order._id.slice(-6)}</h3>
                        <p className="text-gray-400">₹{order.deliveryFee || 50} delivery fee</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                      {order.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Pickup Address</p>
                      <p className="text-white">{order.pickupAddress || 'Address not available'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Delivery Address</p>
                      <p className="text-white">{order.deliveryAddress || order.shippingAddress || 'Address not available'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-gray-400 text-sm">
                      Distance: {order.distance || 'N/A'} • 
                      Estimated time: {order.estimatedTime || '30 mins'}
                    </div>
                    
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => acceptOrder(order._id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Accept Order
                        </button>
                      )}
                      
                      {order.status === 'accepted' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'in_transit')}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Start Delivery
                        </button>
                      )}
                      
                      {order.status === 'in_transit' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'delivered')}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Driver Profile Card */}
        {driverData && (
          <div className="mt-8 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Driver Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Vehicle Type</p>
                <p className="text-white">{driverData.vehicleType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">License Number</p>
                <p className="text-white">{driverData.licenseNumber || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Phone Number</p>
                <p className="text-white">{driverData.phoneNumber || user?.phoneNumber || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Deliveries</p>
                <p className="text-white">{driverData.totalDeliveries || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Rating</p>
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white">{driverData.rating || '5.0'}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Join Date</p>
                <p className="text-white">
                  {driverData.createdAt 
                    ? new Date(driverData.createdAt).toLocaleDateString() 
                    : 'Recently joined'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverDashboard;
