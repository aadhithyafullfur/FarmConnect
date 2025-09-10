import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await api.patch(`/orders/${orderId}/cancel`);
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: 'cancelled' } : order
      ));
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const filteredOrders = orders.filter(order => {
    return filter === 'all' || order.status === filter;
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'preparing': return '👨‍🍳';
      case 'ready': return '📦';
      case 'shipped': return '🚚';
      case 'delivered': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
          My Orders ({orders.length})
        </h2>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
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

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? 'Place your first order to see it here' 
              : `You don't have any ${filter} orders`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold text-green-400">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(order.status)}`}>
                        <span>{getStatusIcon(order.status)}</span>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-400 text-sm">
                        <strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        <strong>Delivery Address:</strong> {order.deliveryAddress}
                      </p>
                      <p className="text-gray-400 text-sm">
                        <strong>Payment Method:</strong> {order.paymentMethod?.toUpperCase() || 'COD'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      ₹{order.totalAmount}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-200 mb-4">Items Ordered</h4>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        {item.product?.image && (
                          <img
                            src={`http://localhost:5000${item.product.image}`}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h5 className="font-medium text-gray-200">
                            {item.product?.name || 'Product Unavailable'}
                          </h5>
                          <p className="text-gray-400 text-sm">
                            ₹{item.price} per {item.product?.unit || 'unit'}
                          </p>
                          {item.product?.farmer && (
                            <p className="text-green-400 text-sm">
                              Farmer: {item.product.farmer.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-200">
                          {item.quantity} {item.product?.unit || 'unit'}s
                        </div>
                        <div className="text-green-400 font-semibold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-400 text-center py-4">No items found</p>
                  )}
                </div>
              </div>

              {/* Order Actions */}
              <div className="p-6 border-t border-gray-700/50 bg-gray-900/30">
                <div className="flex flex-wrap gap-4">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-400 text-white rounded-lg font-medium hover:from-red-400 hover:to-red-300 transition-all duration-200"
                    >
                      Cancel Order
                    </button>
                  )}
                  
                  <button className="px-6 py-2 bg-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-600/50 transition-all duration-200">
                    Track Order
                  </button>
                  
                  <button className="px-6 py-2 bg-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-600/50 transition-all duration-200">
                    Download Invoice
                  </button>

                  {order.status === 'delivered' && (
                    <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-lg font-medium hover:from-green-400 hover:to-green-300 transition-all duration-200">
                      Rate & Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuyerOrders;
