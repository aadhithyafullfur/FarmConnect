import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

function FarmerDashboard() {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
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

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Delete this product?")) {
      try {
        await api.delete(`/products/${productId}`);
        fetchData();
        alert("Product deleted!");
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Failed to delete");
      }
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
                            src={product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`} 
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
                          onClick={() => handleDeleteProduct(product._id)}
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
                      className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-green-500/30 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-green-300">Order #{order._id.slice(-6)}</h3>
                          <p className="text-gray-400 text-sm">Customer: {order.buyer?.name || 'Unknown'}</p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : order.status === "completed"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-400 text-sm">Total Amount</p>
                          <p className="text-2xl font-bold text-green-400">₹{order.totalAmount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Date</p>
                          <p className="text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
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
    </div>
  );
}

export default FarmerDashboard;
