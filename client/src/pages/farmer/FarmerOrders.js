import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/farmer');
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'confirmed': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'preparing': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'ready': return 'text-purple-400 bg-purple-400/20 border-purple-400/30';
      case 'shipped': return 'text-cyan-400 bg-cyan-400/20 border-cyan-400/30';
      case 'delivered': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'cancelled': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'shipped',
      'shipped': 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const getStatusAction = (status) => {
    const actions = {
      'pending': 'Confirm Order',
      'confirmed': 'Start Preparing',
      'preparing': 'Mark Ready',
      'ready': 'Mark Shipped',
      'shipped': 'Mark Delivered'
    };
    return actions[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
            Order Management
          </h1>
          <p className="mt-2 text-gray-400">Track and manage your customer orders</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-700/50 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Orders</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by buyer name or order ID..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:w-64">
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <div className="text-xl font-bold text-green-400">{orders.length}</div>
                <div className="text-xs text-gray-400">Total Orders</div>
              </div>
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <div className="text-xl font-bold text-yellow-400">
                  {orders.filter(o => o.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-12 border border-gray-700/50 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No orders found</h3>
            <p className="text-gray-400">
              {filter === 'all' ? 'No orders have been placed yet' : `No ${filter} orders found`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-green-400">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 text-gray-400">
                        <p><strong>Buyer:</strong> {order.buyer.name}</p>
                        <p><strong>Email:</strong> {order.buyer.email}</p>
                        <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                        {order.deliveryAddress && (
                          <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        ₹{order.totalAmount}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h4 className="text-lg font-medium text-gray-200 mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          {item.product.image && (
                            <img
                              src={`http://localhost:5000${item.product.image}`}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h5 className="font-medium text-gray-200">{item.product.name}</h5>
                            <p className="text-gray-400 text-sm">
                              ₹{item.price} per {item.product.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-200">
                            {item.quantity} {item.product.unit}s
                          </div>
                          <div className="text-green-400 font-semibold">
                            ₹{item.price * item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="p-6 border-t border-gray-700/50 bg-gray-900/30">
                  <div className="flex flex-col md:flex-row gap-4">
                    {order.status !== 'delivered' && order.status !== 'cancelled' && getNextStatus(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl font-medium hover:from-green-400 hover:to-green-300 transition-all duration-200 shadow-lg shadow-green-500/20"
                      >
                        {getStatusAction(order.status)}
                      </button>
                    )}
                    
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-400 text-white rounded-xl font-medium hover:from-red-400 hover:to-red-300 transition-all duration-200"
                      >
                        Cancel Order
                      </button>
                    )}

                    <button className="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-medium hover:bg-gray-600/50 transition-all duration-200">
                      Contact Buyer
                    </button>

                    <button className="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-medium hover:bg-gray-600/50 transition-all duration-200">
                      Print Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerOrders;
