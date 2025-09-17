import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError } from '../../utils/notifications';

function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'out_for_delivery': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-green-400">
          Order Tracking
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">No orders found</div>
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:border-green-500 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-green-400">
                      Order #{order.orderId || order._id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-gray-400">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Items Ordered:</h4>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            {item.productName} x {item.quantity}
                          </span>
                          <span className="text-white">
                            ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Delivery Details:</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>
                        <strong>Address:</strong> {order.deliveryInfo?.address?.street || 'Not specified'}
                      </div>
                      <div>
                        <strong>Payment:</strong> {formatStatus(order.paymentMethod)}
                      </div>
                      {order.deliveryInfo?.instructions && (
                        <div>
                          <strong>Instructions:</strong> {order.deliveryInfo.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <div className="text-lg font-semibold">
                    Total: <span className="text-green-400">₹{order.totalAmount?.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
                  >
                    {selectedOrder === order._id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {selectedOrder === order._id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-green-400 mb-2">Order Timeline:</h5>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <span>Order Placed - {formatDate(order.createdAt)}</span>
                          </div>
                          {order.status !== 'pending' && (
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                              <span>Order Confirmed</span>
                            </div>
                          )}
                          {['preparing', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) && (
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                              <span>Order Preparing</span>
                            </div>
                          )}
                          {['out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) && (
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                              <span>Out for Delivery</span>
                            </div>
                          )}
                          {order.status.toLowerCase() === 'delivered' && (
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                              <span>Delivered</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-green-400 mb-2">Farmer Details:</h5>
                        <div className="space-y-1">
                          {order.items?.map((item, index) => (
                            item.farmerId && (
                              <div key={index} className="text-gray-400">
                                {item.productName}: {item.farmerId.name || 'Unknown Farmer'}
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
    </div>
  );
}

export default OrderTracking;