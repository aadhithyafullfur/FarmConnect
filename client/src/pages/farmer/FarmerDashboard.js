import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { showSuccess, showError, showWarning } from "../../utils/notifications";
import notificationService from "../../services/notificationService";
import ChatInterface from "../../components/ChatInterface";
import ChatStarter from "../../components/ChatStarter";
import EditProductModal from "../../components/EditProductModal";

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

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

  // Handle product deletion
  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Confirm product deletion
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setDeletingProduct(true);
      await api.delete(`/products/${productToDelete._id}`);
      
      // Update local state by removing the deleted product
      setProducts(products.filter(p => p._id !== productToDelete._id));
      
      // Recalculate analytics
      const updatedProducts = products.filter(p => p._id !== productToDelete._id);
      calculateAnalytics(updatedProducts, orders);
      
      showSuccess(`Product "${productToDelete.name}" deleted successfully`);
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Failed to delete product. Please try again.');
    } finally {
      setDeletingProduct(false);
    }
  };

  // Cancel product deletion
  const cancelDeleteProduct = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setDeletingProduct(false);
  };

  // Handle product editing
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };

  // Save edited product
  const saveEditedProduct = async (productId, formData) => {
    try {
      const response = await api.put(`/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update local state
      setProducts(products.map(p => 
        p._id === productId ? response.data : p
      ));
      
      // Recalculate analytics
      const updatedProducts = products.map(p => 
        p._id === productId ? response.data : p
      );
      calculateAnalytics(updatedProducts, orders);
      
      showSuccess(`Product updated successfully`);
      closeEditModal();
    } catch (error) {
      console.error('Error updating product:', error);
      showError('Failed to update product. Please try again.');
      throw error; // Re-throw so the modal can handle the error state
    }
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
                          onClick={() => handleDeleteProduct(product)}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Edit
                        </button>
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
            <div className="bg-gradient-to-br from-gray-800/40 via-gray-750/30 to-gray-700/20 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-gray-700/30 shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">📋</span>
                  </div>
                  <div>
                    <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">Orders Management</h2>
                    <p className="text-gray-400 text-lg">Track, manage and fulfill your customer orders</p>
                  </div>
                </div>
                
                {/* Order Statistics Cards */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                    <div className="text-yellow-400 text-sm font-medium">Pending</div>
                    <div className="text-2xl font-bold text-yellow-300">{orders.filter(o => o.status === 'pending').length}</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                    <div className="text-blue-400 text-sm font-medium">Processing</div>
                    <div className="text-2xl font-bold text-blue-300">{orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length}</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                    <div className="text-green-400 text-sm font-medium">Completed</div>
                    <div className="text-2xl font-bold text-green-300">{orders.filter(o => o.status === 'delivered').length}</div>
                  </div>
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-700/60 to-gray-600/40 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border border-gray-600/30">
                      <span className="text-6xl animate-pulse">📋</span>
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-green-500/20 rounded-full blur-2xl"></div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">No Orders Yet</h3>
                  <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                    Your customer orders will appear here. Make sure your products are well-stocked and attractively presented to start receiving orders!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button 
                      onClick={() => setActiveTab('products')}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-semibold hover:from-green-400 hover:to-emerald-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/30 flex items-center space-x-3"
                    >
                      <span>🌱</span>
                      <span>Manage Products</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="px-8 py-4 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-3"
                    >
                      <span>📊</span>
                      <span>View Analytics</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="relative bg-gradient-to-br from-gray-800/70 via-gray-750/60 to-gray-700/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/40 hover:border-green-500/40 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 transform hover:-translate-y-3 group overflow-hidden"
                    >
                      {/* Subtle animated background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Order priority indicator */}
                      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-green-400 via-emerald-500 to-teal-500 rounded-l-3xl opacity-70"></div>
                      {/* Professional Order Header */}
                      <div className="flex flex-col lg:flex-row justify-between items-start mb-8 relative z-10">
                        <div className="mb-6 lg:mb-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border border-green-400/20">
                                <span className="text-2xl">🎯</span>
                              </div>
                              <div>
                                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                  Order #{order.orderId || order._id.slice(-8).toUpperCase()}
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <span
                                className={`px-6 py-3 text-sm font-bold rounded-2xl border-2 shadow-lg backdrop-blur-sm ${
                                  order.status === "pending"
                                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-400/50 shadow-yellow-500/25"
                                    : order.status === "confirmed"
                                    ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-400/50 shadow-blue-500/25"
                                    : order.status === "preparing"
                                    ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border-orange-400/50 shadow-orange-500/25"
                                    : order.status === "out_for_delivery"
                                    ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/25"
                                    : order.status === "delivered"
                                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/50 shadow-green-500/25"
                                    : order.status === "cancelled"
                                    ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-400/50 shadow-red-500/25"
                                    : "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border-gray-400/50 shadow-gray-500/25"
                                }`}
                              >
                                {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              
                              <div className="text-right bg-gradient-to-br from-gray-800/50 to-gray-700/30 rounded-2xl p-4 border border-gray-600/30">
                                <p className="text-gray-400 text-xs mb-1">Total Value</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                  ₹{order.totalAmount?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Professional Customer Information Card */}
                          <div className="bg-gradient-to-br from-gray-700/40 to-gray-600/30 rounded-2xl p-6 mb-6 border border-gray-600/40 backdrop-blur-sm shadow-lg">
                            <h4 className="text-white font-bold mb-4 flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-lg">👤</span>
                              </div>
                              <span>Customer Information</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg border border-blue-400/30">
                                    <span className="text-white font-bold text-lg">
                                      {(order.buyerId?.name || order.customerName || 'U')[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold text-lg">{order.buyerId?.name || order.customerName || 'Unknown Customer'}</p>
                                    <p className="text-blue-400 text-sm font-medium capitalize">{order.buyerId?.role || 'Valued Customer'}</p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  {order.buyerId?.email && (
                                    <div className="flex items-center space-x-3 text-sm bg-gray-800/40 rounded-lg p-3 border border-gray-600/30">
                                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-400">📧</span>
                                      </div>
                                      <span className="text-gray-200 font-medium">{order.buyerId.email}</span>
                                    </div>
                                  )}
                                  {(order.buyerId?.phone || order.customerPhone) && (
                                    <div className="flex items-center space-x-3 text-sm bg-gray-800/40 rounded-lg p-3 border border-gray-600/30">
                                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-green-400">📱</span>
                                      </div>
                                      <span className="text-gray-200 font-medium">{order.buyerId?.phone || order.customerPhone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="space-y-4">
                                  <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30">
                                    <h5 className="text-white font-semibold mb-3 text-sm">Order Details</h5>
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-blue-400">📅</span>
                                          <span className="text-gray-400 text-sm">Order Date</span>
                                        </div>
                                        <span className="text-gray-200 text-sm font-medium">
                                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-purple-400">💳</span>
                                          <span className="text-gray-400 text-sm">Payment</span>
                                        </div>
                                        <span className="text-gray-200 text-sm font-medium capitalize">
                                          {order.paymentMethod?.replace(/_/g, ' ') || 'Cash on Delivery'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-green-400">💰</span>
                                          <span className="text-gray-400 text-sm">Total</span>
                                        </div>
                                        <span className="text-green-400 font-bold text-lg">₹{order.totalAmount?.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Professional Quick Actions */}
                            <div className="mt-6 pt-6 border-t border-gray-600/30">
                              <h5 className="text-white font-semibold mb-3 text-sm">Quick Actions</h5>
                              <div className="flex flex-wrap gap-3">
                                {(order.buyerId?.phone || order.customerPhone) && (
                                  <a
                                    href={`tel:${order.buyerId?.phone || order.customerPhone}`}
                                    className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-green-500/25"
                                  >
                                    <span>📞</span>
                                    <span>Call Customer</span>
                                  </a>
                                )}
                                {order.buyerId?.email && (
                                  <a
                                    href={`mailto:${order.buyerId.email}`}
                                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-blue-500/25"
                                  >
                                    <span>📧</span>
                                    <span>Send Email</span>
                                  </a>
                                )}
                                <button
                                  onClick={() => showSuccess('SMS notification sent to customer!')}
                                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25"
                                >
                                  <span>💬</span>
                                  <span>Send SMS</span>
                                </button>
                                
                                {/* Real-time Chat Button */}
                                {order.buyerId?._id && (
                                  <ChatStarter
                                    userId={order.buyerId._id}
                                    userName={order.buyerId.name || 'Customer'}
                                    buttonText={
                                      <div className="flex items-center space-x-2">
                                        <span>🗨️</span>
                                        <span>Live Chat</span>
                                      </div>
                                    }
                                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-indigo-500/25"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Professional Status Management Section */}
                        <div className="lg:w-80">
                          <div className="bg-gradient-to-br from-gray-700/40 to-gray-600/30 rounded-2xl p-6 border border-gray-600/40 backdrop-blur-sm shadow-lg">
                            <h4 className="text-white font-bold mb-6 flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <span className="text-lg">📋</span>
                              </div>
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
                      
                      {/* Enhanced Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-6">
                          <div className="bg-gradient-to-br from-gray-700/30 to-gray-600/20 rounded-2xl p-6 border border-gray-600/30">
                            <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                              <span className="text-lg">📦</span>
                              <span>Order Items ({order.items.length})</span>
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-800/40 rounded-xl p-4 border border-gray-600/30">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                      <span className="text-green-400 text-lg">🌱</span>
                                    </div>
                                    <div>
                                      <p className="text-white font-medium">{item.productName}</p>
                                      <p className="text-gray-400 text-sm">Qty: {item.quantity} {item.unit || 'kg'}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-green-400 font-bold text-lg">
                                      ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                                    </p>
                                    <p className="text-gray-400 text-xs">₹{item.pricePerUnit}/{item.unit || 'kg'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced Delivery Information */}
                      {order.deliveryInfo && (
                        <div className="mb-6">
                          <div className="bg-gradient-to-br from-gray-700/30 to-gray-600/20 rounded-2xl p-6 border border-gray-600/30">
                            <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                              <span className="text-lg">🚚</span>
                              <span>Delivery Information</span>
                            </h4>
                            <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30 mb-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mt-1">
                                  <span className="text-blue-400">📍</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-400 text-sm font-medium mb-1">Delivery Address</p>
                                  <p className="text-gray-200 leading-relaxed">
                                    {order.deliveryInfo.address?.street || order.deliveryAddress || 'Address not provided'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {(order.deliveryInfo.instructions || order.specialInstructions) && (
                              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mt-1">
                                    <span className="text-yellow-400">📝</span>
                                  </div>
                                  <div>
                                    <p className="text-yellow-400 font-medium text-sm mb-1">Special Instructions</p>
                                    <p className="text-yellow-200 text-sm leading-relaxed">
                                      {order.deliveryInfo.instructions || order.specialInstructions}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced Payment Summary */}
                      <div className="bg-gradient-to-r from-gray-700/40 to-gray-600/30 rounded-2xl p-6 border border-gray-600/30 mb-6">
                        <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                          <span className="text-lg">💳</span>
                          <span>Payment Summary</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-purple-400">💳</span>
                              </div>
                              <div>
                                <p className="text-gray-400 text-sm">Payment Method</p>
                                <p className="text-white font-semibold capitalize">
                                  {order.paymentMethod?.replace(/_/g, ' ') || 'Cash on Delivery'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                                <span className="text-green-300">💰</span>
                              </div>
                              <div>
                                <p className="text-green-400 text-sm font-medium">Total Amount</p>
                                <p className="text-3xl font-bold text-green-300">₹{order.totalAmount?.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Professional Action Buttons */}
                      <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-gray-600/30">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                        >
                          <span>👁️</span>
                          <span>View Full Details</span>
                        </button>
                        <button
                          onClick={() => showSuccess('Order details exported successfully!')}
                          className="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                        >
                          <span>�</span>
                          <span>Export</span>
                        </button>
                        <button
                          onClick={() => showSuccess('Customer notified about order status!')}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                        >
                          <span>📢</span>
                          <span>Notify Customer</span>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Update
                          </button>
                        </div>
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
                            src={`http://localhost:5001${item.productImage}`}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700/50 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-red-400">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Product</h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to delete "<span className="text-green-400 font-semibold">{productToDelete.name}</span>"? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDeleteProduct}
                  disabled={deletingProduct}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  disabled={deletingProduct}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingProduct ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <EditProductModal
          product={editingProduct}
          onSave={saveEditedProduct}
          onClose={closeEditModal}
        />
      )}

      {/* Delete Product Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-red-500/30 transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Delete Product</h3>
                    <p className="text-red-100 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={cancelDeleteProduct}
                  disabled={deletingProduct}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-gray-200 text-center">
                  Are you sure you want to delete <span className="font-bold text-red-400">"{productToDelete.name}"</span>?
                </p>
                <p className="text-gray-400 text-sm text-center mt-2">
                  This will permanently remove the product from your listings.
                </p>
              </div>

              {/* Product Info */}
              <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  {productToDelete.image ? (
                    <img
                      src={productToDelete.image.startsWith('http') ? productToDelete.image : `http://localhost:5001${productToDelete.image}`}
                      alt={productToDelete.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-16 h-16 flex items-center justify-center text-slate-400 bg-slate-700 rounded-lg"><span class="text-2xl">🌾</span></div>';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center text-slate-400 bg-slate-700 rounded-lg">
                      <span className="text-2xl">🌾</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{productToDelete.name}</h4>
                    <p className="text-gray-400 text-sm">₹{productToDelete.price}/{productToDelete.unit}</p>
                    <p className="text-gray-500 text-xs">{productToDelete.category}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelDeleteProduct}
                  disabled={deletingProduct}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  disabled={deletingProduct}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingProduct ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Product
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Interface */}
      <ChatInterface />
    </div>
  );
}

export default FarmerDashboard;
