import React, { useState, useEffect } from 'react';
import { useShoppingContext } from '../../context/ShoppingContext';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

function BuyerDashboard() {
  const { cart, addToCart, wishlist, toggleWishlist } = useShoppingContext();
  
  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [viewMode, setViewMode] = useState('grid');

  // Categories
  const categories = [
    { id: 'all', name: 'All Products', icon: '🌾' },
    { id: 'vegetable', name: 'Vegetables', icon: '🥬' },
    { id: 'fruit', name: 'Fruits', icon: '🍎' },
    { id: 'grain', name: 'Grains', icon: '🌽' },
    { id: 'dairy', name: 'Dairy', icon: '🥛' },
    { id: 'herbs', name: 'Herbs', icon: '🌿' },
    { id: 'nuts', name: 'Nuts', icon: '🌰' }
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/products');
        setProducts(response.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = [...products];

    // Filter by search term
    if (debouncedSearchTerm) {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(product => {
        const productName = product.name ? product.name.toLowerCase() : '';
        const productDescription = product.description ? product.description.toLowerCase() : '';
        const productCategory = product.category ? product.category.toLowerCase() : '';
        const productFarmerName = product.farmerId?.name ? product.farmerId.name.toLowerCase() : '';
        
        return (
          productName.includes(searchTermLower) ||
          productDescription.includes(searchTermLower) ||
          productCategory.includes(searchTermLower) ||
          productFarmerName.includes(searchTermLower)
        );
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by price range
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price);
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    setFilteredProducts(filtered);
  }, [products, debouncedSearchTerm, selectedCategory, priceRange]);

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Helper functions
  const isInWishlist = (productId) => {
    return wishlist ? wishlist.some(item => item._id === productId) : false;
  };

  // Product Card Component - Amazon Style
  const ProductCard = ({ product, viewMode = 'grid' }) => {
    const isProductInWishlist = isInWishlist(product._id);
    const inStock = product.quantity > 0;

    return (
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 overflow-hidden group">
        {/* Product Image */}
        <div className="relative h-56 bg-slate-700 overflow-hidden">
          {product.image ? (
            <img 
              src={product.image.startsWith('http') ? product.image : `http://localhost:5003${product.image}`} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                // Fallback to crop image if main image fails
                if (product.cropType) {
                  e.target.src = `/crops/${product.cropType}.jpg`;
                } else {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><span class="text-7xl">🌾</span></div>';
                }
              }}
            />
          ) : product.cropType ? (
            <img 
              src={`/crops/${product.cropType}.jpg`} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><span class="text-7xl">🌾</span></div>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <span className="text-7xl">🌾</span>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={() => toggleWishlist(product)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all shadow-lg ${
              isProductInWishlist 
                ? 'bg-red-500 text-white' 
                : 'bg-slate-800/80 text-slate-300 hover:text-red-400 hover:bg-red-900/30 backdrop-blur-sm'
            }`}
          >
            <svg className="w-5 h-5" fill={isProductInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Stock Badge */}
          {!inStock && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              Out of Stock
            </div>
          )}

          {/* Organic Badge */}
          {product.isOrganic && (
            <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              🌱 Organic
            </div>
          )}

          {/* Price Overlay */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
            <span className="text-lg font-bold">₹{product.price}</span>
            <span className="text-xs text-slate-300">/{product.unit || 'kg'}</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-5">
          <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>

          {/* Rating and Farmer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400 text-sm">
                {'★'.repeat(4)}{'☆'.repeat(1)}
              </div>
              <span className="text-slate-500 text-xs">(4.2)</span>
            </div>
            
            <span className="text-xs text-emerald-400 font-medium">
              {product.farmer?.name || 'Local Farmer'}
            </span>
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between mb-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              inStock ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}>
              {inStock ? `${product.quantity} available` : 'Out of Stock'}
            </div>
            
            {product.isOrganic && (
              <span className="text-green-400 text-xs font-medium">🌱 Certified Organic</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const result = await addToCart(product);
                if (result.success) {
                  // Optionally show a success toast/notification
                  console.log('Added to cart:', product.name);
                }
              }}
              disabled={!inStock}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                inStock
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/25'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
              }`}
            >
              {inStock ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
            
            <button
              onClick={() => window.open(`tel:${product.farmer?.phone || ''}`, '_blank')}
              className="px-4 py-3 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 hover:text-white transition-all"
              title="Contact Farmer"
            >
              📞
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Category Navigation - Full screen width, properly positioned below navbar */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-sm pt-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Browse Categories</h2>
            <span className="text-sm text-slate-400">Choose from our premium selection</span>
          </div>
          <div className="flex items-center space-x-6 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                  selectedCategory === category.id
                    ? 'bg-emerald-600 text-white shadow-lg border-emerald-500 scale-105'
                    : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Amazon-style Price Range & Search Bar */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left side - Search and Price Range */}
            <div className="flex items-center gap-4 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search for fresh vegetables, fruits, grains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Search is already happening via useEffect, so no additional action needed
                    }
                  }}
                  className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-800 placeholder-gray-500"
                />
                <button 
                  onClick={() => {
                    // Clear search if there's a term, otherwise focus input
                    if (searchTerm) {
                      setSearchTerm('');
                    } else {
                      document.querySelector('input[placeholder*="Search for fresh"]').focus();
                    }
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-md transition-colors"
                  title={searchTerm ? "Clear search" : "Search"}
                >
                  {searchTerm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg">
                <span className="text-white text-sm font-medium">Price:</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-20 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={() => setPriceRange({ min: '', max: '' })}
                  className="text-emerald-400 hover:text-emerald-300 text-sm ml-2"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Right side - Sort and View options */}
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="newest">🆕 Newest</option>
                <option value="price-low">💰 Price ↑</option>
                <option value="price-high">💎 Price ↓</option>
                <option value="name">🔤 A-Z</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white'}`}
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white'}`}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container - Amazon Style Layout */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats Banner */}
        <div className="mb-6 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🌾 Fresh Farm Products</h2>
              <p className="text-emerald-100">Directly from farmers to your table - Premium quality guaranteed</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{sortedProducts.length}</div>
              <div className="text-emerald-100">Products Available</div>
            </div>
          </div>
        </div>

        {/* Featured Categories Banner */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors cursor-pointer">
            <div className="text-4xl mb-2">🥬</div>
            <div className="text-white font-semibold">Fresh Vegetables</div>
            <div className="text-slate-400 text-sm">Farm Fresh Daily</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors cursor-pointer">
            <div className="text-4xl mb-2">🍎</div>
            <div className="text-white font-semibold">Organic Fruits</div>
            <div className="text-slate-400 text-sm">Naturally Sweet</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors cursor-pointer">
            <div className="text-4xl mb-2">🌽</div>
            <div className="text-white font-semibold">Farm Grains</div>
            <div className="text-slate-400 text-sm">Pure & Natural</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors cursor-pointer">
            <div className="text-4xl mb-2">🥛</div>
            <div className="text-white font-semibold">Dairy Fresh</div>
            <div className="text-slate-400 text-sm">From Local Farms</div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              {debouncedSearchTerm ? `Results for "${debouncedSearchTerm}"` : selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <span className="text-slate-400 bg-slate-800 px-3 py-1 rounded-full text-sm">
              {sortedProducts.length} items found
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-slate-400 text-lg">Loading fresh products...</p>
              </div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-3">No products found</h3>
              <p className="text-slate-400 mb-8 text-lg">Try adjusting your search or filters to find what you're looking for</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceRange({ min: '', max: '' });
                  setSortBy('newest');
                }}
                className="px-8 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6' 
                : 'space-y-4'
            }`}>
              {sortedProducts.map(product => (
                <ProductCard key={product._id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart - Dark Theme */}
      {cart && cart.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-600 text-white p-6 rounded-xl shadow-2xl z-50 max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-white">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart
              </p>
              <p className="text-emerald-400 font-semibold">
                Total: ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
              </p>
            </div>
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg">
              View Cart →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerDashboard;
