import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { showSuccess, showError, showWarning } from "../../utils/notifications";
import notificationService from "../../services/notificationService";

function FarmerDashboard() {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    availableProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    recentProducts: []
  });
  const [loading, setLoading] = useState(true);

  // Navigation handler for tab switching
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const calculateAnalytics = (products, orders) => {
    setAnalytics({
      totalProducts: products.length,
      availableProducts: products.filter((p) => p.status === "available").length,
      totalRevenue: orders
        .filter((o) => o.status === "completed")
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      completedOrders: orders.filter((o) => o.status === "completed").length,
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        api.get("/products/my-products"),
        api.get("/orders/farmer"),
      ]);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      calculateAnalytics(productsRes.data || [], ordersRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup real-time notifications for new orders
  useEffect(() => {
    if (user && user.role === 'farmer') {
      // Connect to notification service
      notificationService.connect(user.id);

      // Listen for new orders
      const handleNewOrder = (notification) => {
        if (notification.type === 'new_order') {
          showSuccess(`New Order Received! Order #${notification.data.orderNumber || 'N/A'}`);
          
          // Refresh orders to show the new order
          fetchData();
          
          // Show detailed notification
          if (notification.data.orderDetails) {
            const order = notification.data.orderDetails;
            showWarning(`Order from ${order.customerName || 'Customer'} - Total: ₹${order.totalAmount || 0}`);
          }
        }
      };

      // Register notification listener
      notificationService.addListener('farmer-orders', handleNewOrder);

      // Request notification permissions
      notificationService.requestPermission();

      // Cleanup on unmount
      return () => {
        notificationService.removeListener('farmer-orders');
        notificationService.disconnect();
      };
    }
  }, [user, fetchData]);



  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
      showSuccess(`Order status updated to ${newStatus}`);
      
      // Recalculate analytics
      const updatedOrders = orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      calculateAnalytics(products, updatedOrders);
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Failed to update order status');
    }
  };

  // Handle viewing order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Close order modal
  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200 pt-16">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800/50 backdrop-blur-md border-r border-gray-700/50 p-6 hidden md:flex flex-col fixed h-full overflow-y-auto">
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-green-400 mb-8">Farmer Panel</h2>
          <nav className="flex flex-col space-y-6">
            
            {/* Dashboard Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dashboard</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleTabChange('overview')}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-200 border backdrop-blur-sm text-left flex items-center space-x-3 ${
                    activeTab === 'overview'
                      ? 'bg-green-600/30 text-green-300 border-green-500/50 shadow-lg'
                      : 'border-transparent hover:bg-green-600/20 hover:text-green-300 hover:border-green-500/30'
                  }`}
                >
                  <span className="text-xl">📊</span>
                  <span className="font-medium">Overview</span>
                </button>
                
                <button
                  onClick={() => handleTabChange('analytics')}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-200 border backdrop-blur-sm text-left flex items-center space-x-3 ${
                    activeTab === 'analytics'
                      ? 'bg-green-600/30 text-green-300 border-green-500/50 shadow-lg'
                      : 'border-transparent hover:bg-green-600/20 hover:text-green-300 hover:border-green-500/30'
                  }`}
                >
                  <span className="text-xl">📈</span>
                  <span className="font-medium">Analytics</span>
                </button>
              </div>
            </div>

            {/* Products Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Products</h3>
              <div className="space-y-1">
                <Link
                  to="/farmer/add-product"
                  className="w-full px-4 py-3 rounded-lg hover:bg-green-600/20 hover:text-green-300 transition-all duration-200 border border-transparent hover:border-green-500/30 backdrop-blur-sm flex items-center space-x-3"
                >
                  <span className="text-xl">➕</span>
                  <span className="font-medium">Add Product</span>
                </Link>
                
                <button
                  onClick={() => handleTabChange('products')}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-200 border backdrop-blur-sm text-left flex items-center space-x-3 ${
                    activeTab === 'products'
                      ? 'bg-green-600/30 text-green-300 border-green-500/50 shadow-lg'
                      : 'border-transparent hover:bg-green-600/20 hover:text-green-300 hover:border-green-500/30'
                  }`}
                >
                  <span className="text-xl">🌾</span>
                  <span className="font-medium">My Products</span>
                </button>
                
                <button
                  onClick={() => handleTabChange('inventory')}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-200 border backdrop-blur-sm text-left flex items-center space-x-3 ${
                    activeTab === 'inventory'
                      ? 'bg-green-600/30 text-green-300 border-green-500/50 shadow-lg'
                      : 'border-transparent hover:bg-green-600/20 hover:text-green-300 hover:border-green-500/30'
                  }`}
                >
                  <span className="text-xl">📋</span>
                  <span className="font-medium">Inventory</span>
                </button>
              </div>
            </div>

            {/* Sales Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sales</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-200 border backdrop-blur-sm text-left flex items-center space-x-3 ${
                    activeTab === 'orders'
                      ? 'bg-green-600/30 text-green-300 border-green-500/50 shadow-lg'
                      : 'border-transparent hover:bg-green-600/20 hover:text-green-300 hover:border-green-500/30'
                  }`}
                >
                  <span className="text-xl">📦</span>
                  <span className="font-medium">Orders</span>
                </button>
                
                <button
                  onClick={() => handleTabChange('customers')}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-200 border backdrop-blur-sm text-left flex items-center space-x-3 ${
                    activeTab === 'customers'
                      ? 'bg-green-600/30 text-green-300 border-green-500/50 shadow-lg'
                      : 'border-transparent hover:bg-green-600/20 hover:text-green-300 hover:border-green-500/30'
                  }`}
                >
                  <span className="text-xl">👥</span>
                  <span className="font-medium">Customers</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8 pt-4">
          <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50">
            <h1 className="text-3xl lg:text-4xl font-bold text-green-400 mb-2">Farmer Dashboard</h1>
            <p className="text-gray-400 text-lg">Welcome back, {user?.name || "Farmer"} 👋</p>
            <p className="text-gray-500 text-sm mt-2">Manage your products and track your farming business</p>
          </div>
        </header>

        {/* Dynamic Content Based on Active Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              <div className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700/30 hover:border-green-500/30 group">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm font-medium">Total Products</p>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <span className="text-green-400 text-lg">📦</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
                  {analytics.totalProducts}
                </h2>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700/30 hover:border-blue-500/30 group">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm font-medium">Available</p>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <span className="text-blue-400 text-lg">✅</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {analytics.availableProducts}
                </h2>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700/30 hover:border-yellow-500/30 group">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm font-medium">Pending Orders</p>
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                    <span className="text-yellow-400 text-lg">⏳</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">
                  {analytics.pendingOrders}
                </h2>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700/30 hover:border-purple-500/30 group">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm font-medium">Completed Orders</p>
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <span className="text-purple-400 text-lg">🎉</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                  {analytics.completedOrders}
                </h2>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700/30 hover:border-emerald-500/30 group">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <span className="text-emerald-400 text-lg">💰</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  ₹{analytics.totalRevenue.toLocaleString()}
                </h2>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mb-12">
              <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
                <h2 className="text-2xl font-bold text-green-400 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    to="/farmer/add-product"
                    className="group bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6 hover:border-green-400/50 transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <span className="text-2xl">➕</span>
                      </div>
                      <div>
                        <h3 className="text-green-400 font-semibold">Add Product</h3>
                        <p className="text-gray-400 text-sm">List new items</p>
                      </div>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => handleTabChange('products')}
                    className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all duration-200 hover:scale-105 text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <span className="text-2xl">🌾</span>
                      </div>
                      <div>
                        <h3 className="text-blue-400 font-semibold">Manage Products</h3>
                        <p className="text-gray-400 text-sm">Edit your listings</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleTabChange('orders')}
                    className="group bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-400/50 transition-all duration-200 hover:scale-105 text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div>
                        <h3 className="text-yellow-400 font-semibold">View Orders</h3>
                        <p className="text-gray-400 text-sm">Track orders</p>
                      </div>
                    </div>
                  </button>
                  
                  <Link
                    to="/farmer/profile"
                    className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <h3 className="text-purple-400 font-semibold">Profile</h3>
                        <p className="text-gray-400 text-sm">Update details</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Recent Products Preview */}
            <section className="mb-12">
              <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-green-400">Recent Products</h2>
                  <button
                    onClick={() => handleTabChange('products')}
                    className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-500">📦</span>
                    </div>
                    <p className="text-gray-400">No products yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.slice(0, 3).map((product) => (
                      <div key={product._id} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/30 hover:border-green-500/30 transition-all duration-300 group">
                        {/* Product Image */}
                        <div className="relative h-32 bg-gray-700/50 overflow-hidden">
                          {product.image ? (
                            <img 
                              src={product.image.startsWith('http') ? product.image : `http://localhost:5001${product.image}`} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                if (product.cropType) {
                                  e.target.src = `/crops/${product.cropType}.jpg`;
                                } else {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><span class="text-2xl">🌾</span></div>';
                                }
                              }}
                            />
                          ) : product.cropType ? (
                            <img 
                              src={`/crops/${product.cropType}.jpg`} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><span class="text-2xl">🌾</span></div>';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-2xl">🌾</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="text-green-300 font-medium mb-2 line-clamp-1">{product.name}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-green-400 font-bold">₹{product.price}</span>
                            <span className="text-gray-400 text-sm">{product.quantity} {product.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <section className="mb-12">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-green-400 mb-2">My Products</h2>
                  <p className="text-gray-400">Manage and track your agricultural products</p>
                </div>
                <Link
                  to="/farmer/add-product"
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-green-900/20 hover:shadow-green-900/40 transform hover:scale-105"
                >
                  <span className="mr-2">➕</span>
                  Add New Product
                </Link>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-gray-500">🌾</span>
                  </div>
                  <p className="text-gray-400 text-lg mb-4">No products yet</p>
                  <p className="text-gray-500 mb-8">Start by adding your first agricultural product</p>
                  <Link
                    to="/farmer/add-product"
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <span className="mr-2">➕</span>
                    Add Product
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="bg-gray-800/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700/50 hover:border-green-500/30 group"
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-700/50 overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image.startsWith('http') ? product.image : `http://localhost:5001${product.image}`} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // Fallback to crop image if main image fails
                              if (product.cropType) {
                                e.target.src = `/crops/${product.cropType}.jpg`;
                              } else {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><span class="text-4xl">🌾</span></div>';
                              }
                            }}
                          />
                        ) : product.cropType ? (
                          <img 
                            src={`/crops/${product.cropType}.jpg`} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><span class="text-4xl">🌾</span></div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">🌾</span>
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                              product.status === "available"
                                ? "bg-green-500/80 text-white border border-green-400/50"
                                : "bg-red-500/80 text-white border border-red-400/50"
                            }`}
                          >
                            {product.status}
                          </span>
                        </div>
                        
                        {/* Price Overlay */}
                        <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg">
                          <span className="text-lg font-bold text-green-400">₹{product.price}</span>
                          <span className="text-xs text-gray-300">/{product.unit}</span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-green-300 group-hover:text-green-200 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Stock</span>
                          <span className="text-white font-medium">{product.quantity} {product.unit}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Category</span>
                          <span className="text-blue-400 text-sm font-medium capitalize">{product.category}</span>
                        </div>
                        
                        {product.description && (
                          <div className="pt-2">
                            <span className="text-gray-400 text-sm">Description</span>
                            <p className="text-gray-300 text-sm mt-1 line-clamp-2">{product.description}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/50">
                        <button
                          onClick={() => showWarning("Delete feature coming soon")}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Delete
                        </button>
                        <Link
                          to={`/farmer/edit-product/${product._id}`}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Edit
                        </Link>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <section className="mb-12">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-green-400 mb-2">Orders</h2>
                  <p className="text-gray-400">Track and manage your product orders</p>
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-gray-500">📋</span>
                  </div>
                  <p className="text-gray-400 text-lg mb-4">No orders yet</p>
                  <p className="text-gray-500 mb-8">Orders will appear here when customers purchase your products</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-gradient-to-r from-gray-800/60 to-gray-800/40 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50 hover:border-green-500/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Enhanced Order Header */}
                      <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
                        <div className="mb-4 lg:mb-0 flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-2xl font-bold text-green-400">
                              Order #{order.orderId || order._id.slice(-8).toUpperCase()}
                            </h3>
                            <span
                              className={`px-4 py-2 text-sm font-semibold rounded-full border ${
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
                              }`}
                            >
                              {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          
                          {/* Customer Information Card */}
                          <div className="bg-gray-700/30 rounded-xl p-4 mb-4 border border-gray-600/30">
                            <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                              <span>👤</span>
                              <span>Customer Information</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">
                                      {(order.buyerId?.name || order.customerName || 'U')[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{order.buyerId?.name || order.customerName || 'Unknown Customer'}</p>
                                    <p className="text-gray-400 text-sm">{order.buyerId?.role || 'Buyer'}</p>
                                  </div>
                                </div>
                                {order.buyerId?.email && (
                                  <div className="flex items-center space-x-2 text-sm mb-1">
                                    <span className="text-gray-400">📧</span>
                                    <span className="text-gray-300">{order.buyerId.email}</span>
                                  </div>
                                )}
                                {(order.buyerId?.phone || order.customerPhone) && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-gray-400">📱</span>
                                    <span className="text-gray-300">{order.buyerId?.phone || order.customerPhone}</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-gray-400">📅</span>
                                    <span className="text-gray-300">
                                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-gray-400">💳</span>
                                    <span className="text-gray-300 capitalize">
                                      {order.paymentMethod?.replace(/_/g, ' ') || 'Cash'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-gray-400">💰</span>
                                    <span className="text-green-400 font-semibold text-lg">₹{order.totalAmount?.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions for Customer Contact */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-600/30">
                              {(order.buyerId?.phone || order.customerPhone) && (
                                <a
                                  href={`tel:${order.buyerId?.phone || order.customerPhone}`}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors flex items-center space-x-1"
                                >
                                  <span>📞</span>
                                  <span>Call</span>
                                </a>
                              )}
                              {order.buyerId?.email && (
                                <a
                                  href={`mailto:${order.buyerId.email}`}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors flex items-center space-x-1"
                                >
                                  <span>📧</span>
                                  <span>Email</span>
                                </a>
                              )}
                              <button
                                onClick={() => showSuccess('SMS sent to customer!')}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors flex items-center space-x-1"
                              >
                                <span>💬</span>
                                <span>SMS</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Status Management Section */}
                        <div className="lg:w-80">
                          <div className="bg-gray-700/20 rounded-xl p-4 border border-gray-600/30">
                            <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                              <span>📋</span>
                              <span>Order Management</span>
                            </h4>
                            
                            <div className="space-y-4">
                              {/* Current Status Display */}
                              <div className="text-center">
                                <div className="text-gray-400 text-sm mb-2">Current Status</div>
                                <span
                                  className={`px-4 py-2 text-sm font-semibold rounded-full border block ${
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
                                  }`}
                                >
                                  {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="space-y-2">
                                {order.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'confirmed')}
                                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                      <span>✅</span>
                                      <span>Confirm Order</span>
                                    </button>
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                                      className="w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                      <span>👨‍🍳</span>
                                      <span>Start Preparing</span>
                                    </button>
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                      className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                      <span>❌</span>
                                      <span>Cancel Order</span>
                                    </button>
                                  </>
                                )}
                                
                                {order.status === 'confirmed' && (
                                  <>
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                                      className="w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                      <span>👨‍🍳</span>
                                      <span>Start Preparing</span>
                                    </button>
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'out_for_delivery')}
                                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                      <span>🚚</span>
                                      <span>Ready for Delivery</span>
                                    </button>
                                  </>
                                )}
                                
                                {order.status === 'preparing' && (
                                  <>
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'out_for_delivery')}
                                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                      <span>🚚</span>
                                      <span>Ready for Delivery</span>
                                    </button>
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'delivered')}
                                      className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                      <span>✅</span>
                                      <span>Mark as Delivered</span>
                                    </button>
                                  </>
                                )}

                                {order.status === 'out_for_delivery' && (
                                  <button
                                    onClick={() => updateOrderStatus(order._id, 'delivered')}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                  >
                                    <span>✅</span>
                                    <span>Mark as Delivered</span>
                                  </button>
                                )}

                                {(order.status === 'delivered' || order.status === 'cancelled') && (
                                  <div className="text-center py-4">
                                    <span className="text-gray-400 text-sm">Order {order.status}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Items:</h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-400">
                                  {item.productName} x {item.quantity} {item.unit || 'kg'}
                                </span>
                                <span className="text-green-400">
                                  ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Delivery Info */}
                      {order.deliveryInfo && (
                        <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Delivery Address:</h4>
                          <p className="text-sm text-gray-400">
                            {order.deliveryInfo.address?.street || 'Address not provided'}
                          </p>
                          {order.deliveryInfo.instructions && (
                            <p className="text-xs text-gray-500 mt-1">
                              <strong>Instructions:</strong> {order.deliveryInfo.instructions}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                        <div>
                          <p className="text-gray-400 text-sm">Payment Method</p>
                          <p className="text-white text-sm capitalize">
                            {order.paymentMethod?.replace(/_/g, ' ') || 'Not specified'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Total Amount</p>
                          <p className="text-2xl font-bold text-green-400">₹{order.totalAmount?.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end mt-4 space-x-2">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors duration-200 flex items-center space-x-2"
                        >
                          <span>👁️</span>
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <section className="mb-12">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-green-400 mb-2">Analytics & Reports</h2>
                  <p className="text-gray-400">Detailed insights into your farming business performance</p>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <h3 className="text-green-400 font-semibold">Average Order Value</h3>
                      <p className="text-2xl font-bold text-green-300">
                        ₹{orders.length > 0 ? Math.round(analytics.totalRevenue / orders.length) : 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div>
                      <h3 className="text-blue-400 font-semibold">Success Rate</h3>
                      <p className="text-2xl font-bold text-blue-300">
                        {orders.length > 0 ? Math.round((analytics.completedOrders / orders.length) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⭐</span>
                    </div>
                    <div>
                      <h3 className="text-purple-400 font-semibold">Product Variety</h3>
                      <p className="text-2xl font-bold text-purple-300">
                        {products.length} Items
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30 text-center">
                <span className="text-4xl text-gray-500 mb-4 block">📊</span>
                <h3 className="text-lg font-semibold text-green-300 mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-gray-400">Detailed charts and reports will be available in future updates</p>
              </div>
            </div>
          </section>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <section className="mb-12">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-green-400 mb-2">Inventory Management</h2>
                  <p className="text-gray-400">Track and manage your product inventory levels</p>
                </div>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-gray-500">📋</span>
                  </div>
                  <p className="text-gray-400 text-lg mb-4">No inventory to track</p>
                  <p className="text-gray-500 mb-8">Add products to start managing your inventory</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-green-500/30 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-green-300 mb-2">{product.name}</h3>
                          <p className="text-gray-400 text-sm">{product.category}</p>
                        </div>
                        <div className="flex space-x-6 text-right">
                          <div>
                            <p className="text-gray-400 text-sm">Stock</p>
                            <p className={`text-xl font-bold ${
                              product.quantity < 10 ? 'text-red-400' : 
                              product.quantity < 50 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {product.quantity} {product.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Value</p>
                            <p className="text-xl font-bold text-blue-400">₹{(product.price * product.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            product.quantity < 10
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : product.quantity < 50
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}
                        >
                          {product.quantity < 10 ? 'Low Stock' : product.quantity < 50 ? 'Medium Stock' : 'Good Stock'}
                        </span>
                        <Link
                          to={`/farmer/edit-product/${product._id}`}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Update
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <section className="mb-12">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-green-400 mb-2">Customer Management</h2>
                  <p className="text-gray-400">View and manage your customer relationships</p>
                </div>
              </div>
              
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl text-gray-500">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-green-300 mb-2">Customer Management Coming Soon</h3>
                <p className="text-gray-400 mb-4">Advanced customer relationship features will be available soon</p>
                <p className="text-gray-500">Track customer orders, preferences, and communication history</p>
              </div>
            </div>
          </section>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <section className="mb-12">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-gray-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-green-400 mb-2">Settings</h2>
                  <p className="text-gray-400">Manage your account and application preferences</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
                  <h3 className="text-lg font-semibold text-green-300 mb-6">Account Settings</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Profile Information</h4>
                        <p className="text-gray-400 text-sm">Update your personal details</p>
                      </div>
                      <Link
                        to="/farmer/profile"
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        Edit
                      </Link>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Notifications</h4>
                        <p className="text-gray-400 text-sm">Manage notification preferences</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded-lg text-sm font-medium transition-all duration-200">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
                  <h3 className="text-lg font-semibold text-green-300 mb-6">Business Settings</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Farm Information</h4>
                        <p className="text-gray-400 text-sm">Update farm details</p>
                      </div>
                      <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200">
                        Edit
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Delivery Options</h4>
                        <p className="text-gray-400 text-sm">Configure delivery settings</p>
                      </div>
                      <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 rounded-lg text-sm font-medium transition-all duration-200">
                        Setup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">Order Details</h2>
              <button
                onClick={closeOrderModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Information */}
              <div className="space-y-4">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order ID:</span>
                      <span className="text-white font-mono">#{selectedOrder._id?.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white">
                        {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        selectedOrder.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : selectedOrder.status === "confirmed"
                          ? "bg-blue-500/20 text-blue-400"
                          : selectedOrder.status === "preparing"
                          ? "bg-orange-500/20 text-orange-400"
                          : selectedOrder.status === "out_for_delivery"
                          ? "bg-purple-500/20 text-purple-400"
                          : selectedOrder.status === "delivered"
                          ? "bg-green-500/20 text-green-400"
                          : selectedOrder.status === "cancelled"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {selectedOrder.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Method:</span>
                      <span className="text-white capitalize">
                        {selectedOrder.paymentMethod?.replace(/_/g, ' ') || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="text-green-400">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{selectedOrder.customer?.name || selectedOrder.customerName || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{selectedOrder.customer?.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{selectedOrder.customer?.phone || selectedOrder.customerPhone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items and Delivery */}
              <div className="space-y-4">
                {/* Order Items */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-600/30 rounded-lg">
                        {item.productImage && (
                          <img
                            src={`http://localhost:5003${item.productImage}`}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.productName}</p>
                          <p className="text-gray-400 text-sm">
                            ₹{item.pricePerUnit}/{item.unit || 'kg'} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold">
                            ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Information */}
                {selectedOrder.deliveryInfo && (
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Delivery Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-400">Address:</span>
                        <p className="text-white mt-1">
                          {selectedOrder.deliveryInfo.address?.street || 'Address not provided'}
                        </p>
                        {selectedOrder.deliveryInfo.address?.city && (
                          <p className="text-gray-300">
                            {selectedOrder.deliveryInfo.address.city}, {selectedOrder.deliveryInfo.address.state} {selectedOrder.deliveryInfo.address.zipCode}
                          </p>
                        )}
                      </div>
                      {selectedOrder.deliveryInfo.instructions && (
                        <div>
                          <span className="text-gray-400">Special Instructions:</span>
                          <p className="text-white mt-1 bg-gray-600/30 p-2 rounded">
                            {selectedOrder.deliveryInfo.instructions}
                          </p>
                        </div>
                      )}
                      {selectedOrder.deliveryInfo.preferredTime && (
                        <div>
                          <span className="text-gray-400">Preferred Delivery Time:</span>
                          <p className="text-white mt-1">{selectedOrder.deliveryInfo.preferredTime}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={closeOrderModal}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              
              {selectedOrder.status === 'pending' && (
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder._id, 'confirmed');
                      closeOrderModal();
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder._id, 'cancelled');
                      closeOrderModal();
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
              
              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder._id, 'preparing');
                    closeOrderModal();
                  }}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
                >
                  Start Preparing
                </button>
              )}
              
              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder._id, 'out_for_delivery');
                    closeOrderModal();
                  }}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                >
                  Ready for Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerDashboard;
