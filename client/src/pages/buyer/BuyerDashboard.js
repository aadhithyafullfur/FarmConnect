import React, { useState, useEffect, useRef } from 'react';
import { useShoppingContext } from '../../context/ShoppingContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import ChatInterface from '../../components/ChatInterface';
import ChatStarter from '../../components/ChatStarter';

function BuyerDashboard() {
  const { cart, addToCart, wishlist, toggleWishlist } = useShoppingContext();
  const navigate = useNavigate();
  
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
  const [showFilters, setShowFilters] = useState(false);
  const [addedToCart, setAddedToCart] = useState(null);
  const scrollContainerRef = useRef(null);

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

  // Show toast notification when item is added to cart
  const showCartNotification = (productName) => {
    setAddedToCart(productName);
    setTimeout(() => setAddedToCart(null), 3000);
  };

  // Smooth scroll for categories
  const scrollCategories = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Enhanced Product Card Component - Modern Design
  const ProductCard = ({ product, viewMode = 'grid' }) => {
    const isProductInWishlist = isInWishlist(product._id);
    const inStock = product.quantity > 0;
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleAddToCart = async () => {
      const result = await addToCart(product);
      if (result.success) {
        showCartNotification(product.name);
      }
    };

    if (viewMode === 'list') {
      return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden group">
          <div className="flex p-4 gap-4">
            {/* Image */}
            <div className="relative w-32 h-32 flex-shrink-0 bg-slate-700 rounded-xl overflow-hidden">
              {!imageError && product.image ? (
                <img 
                  src={product.image.startsWith('http') ? product.image : `http://localhost:5001${product.image}`} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />
              ) : product.cropType ? (
                <img 
                  src={`/crops/${product.cropType}.jpg`} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🌾</div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-xl text-white group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h3>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-2 rounded-full transition-all ${
                      isProductInWishlist ? 'bg-red-500 text-white' : 'bg-slate-700/80 text-slate-300 hover:text-red-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={isProductInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl font-bold text-emerald-400">₹{product.price}</span>
                  <span className="text-slate-400">per {product.unit || 'kg'}</span>
                  {product.organicCertified && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      🌱 Organic
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex-1 py-2.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    inStock
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <ChatStarter
                  userId={product.farmerId?._id}
                  userName={product.farmerId?.name || 'Farmer'}
                  buttonText=""
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </ChatStarter>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700/50 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden group transform hover:-translate-y-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className="relative h-64 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
          {!imageError && product.image ? (
            <img 
              src={product.image.startsWith('http') ? product.image : `http://localhost:5001${product.image}`} 
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-700 ${isHovered ? 'scale-110 rotate-2' : 'scale-100'}`}
              onError={() => setImageError(true)}
            />
          ) : product.cropType ? (
            <img 
              src={`/crops/${product.cropType}.jpg`} 
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl animate-pulse">🌾</div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Wishlist Button */}
          <button
            onClick={() => toggleWishlist(product)}
            className={`absolute top-4 right-4 p-3 rounded-full transition-all duration-300 shadow-xl backdrop-blur-md ${
              isProductInWishlist 
                ? 'bg-red-500 text-white scale-110' 
                : 'bg-slate-900/70 text-slate-300 hover:text-red-400 hover:scale-110'
            }`}
          >
            <svg className="w-6 h-6" fill={isProductInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Stock Badge */}
          {!inStock && (
            <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl animate-pulse">
              Out of Stock
            </div>
          )}

          {/* Organic Badge */}
          {product.organicCertified && (
            <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Certified Organic
            </div>
          )}

          {/* Quick Actions - Show on Hover */}
          <div className={`absolute bottom-4 left-4 right-4 flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all backdrop-blur-md shadow-xl flex items-center justify-center gap-2 ${
                inStock
                  ? 'bg-emerald-500/90 hover:bg-emerald-600 text-white'
                  : 'bg-slate-700/80 text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {inStock ? 'Add' : 'N/A'}
            </button>
            <ChatStarter
              userId={product.farmerId?._id}
              userName={product.farmerId?.name || 'Farmer'}
              buttonText=""
              className="px-4 py-3 bg-blue-600/90 backdrop-blur-md hover:bg-blue-700 text-white rounded-xl transition-all shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </ChatStarter>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-white line-clamp-2 group-hover:text-emerald-400 transition-colors flex-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 text-yellow-400 flex-shrink-0">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold">4.5</span>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
            {product.description || 'Fresh from the farm to your table'}
          </p>

          {/* Price & Stock */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                ₹{product.price}
              </span>
              <span className="text-slate-500 text-sm">/{product.unit || 'kg'}</span>
            </div>
            
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              inStock ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {inStock ? `${product.quantity} in stock` : 'Sold Out'}
            </div>
          </div>

          {/* Farmer Info */}
          <div className="flex items-center justify-between pt-2 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs">{product.farmerId?.name || 'Local Farmer'}</span>
            </div>
            
            {product.farmLocation && (
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {product.farmLocation}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      {/* Toast Notification */}
      {addedToCart && (
        <div className="fixed top-24 right-6 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400/50">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Added to Cart!</p>
              <p className="text-sm text-emerald-100">{addedToCart}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner with Search */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 pt-20 pb-16 overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-700"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl">
              Farm Fresh Marketplace
            </h1>
            <p className="text-xl md:text-2xl text-emerald-50 font-medium">
              🌾 Direct from Local Farms to Your Table
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400 ml-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for fresh vegetables, fruits, grains, dairy products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-6 text-lg text-gray-900 placeholder-gray-500 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-10 py-6 hover:from-emerald-700 hover:to-emerald-600 transition-all font-bold text-lg">
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-3 gap-6 text-white">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black">{products.length}</div>
                <div className="text-sm text-emerald-50">Fresh Products</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black">{cart?.length || 0}</div>
                <div className="text-sm text-emerald-50">Cart Items</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black">{wishlist?.length || 0}</div>
                <div className="text-sm text-emerald-50">Wishlist</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills with Scroll */}
      <div className="sticky top-16 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollCategories('left')}
              className="flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 border-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/50 scale-105'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-white hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="whitespace-nowrap">{category.name}</span>
                  {selectedCategory === category.id && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {sortedProducts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCategories('right')}
              className="flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Controls Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left - Price Range & Filters */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all flex items-center gap-2 border border-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="font-medium">Filters</span>
                {(priceRange.min || priceRange.max) && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">1</span>
                )}
              </button>

              {/* Price Range Inputs */}
              {showFilters && (
                <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                  <span className="text-white font-medium text-sm">Price Range:</span>
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-slate-500">→</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  {(priceRange.min || priceRange.max) && (
                    <button
                      onClick={() => setPriceRange({ min: '', max: '' })}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Active Filters Display */}
              {selectedCategory !== 'all' && (
                <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <span className="text-sm font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="hover:text-emerald-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Right - Sort & View */}
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none hover:bg-slate-700 transition-all cursor-pointer"
              >
                <option value="newest">🆕 Newest First</option>
                <option value="price-low">💰 Price: Low to High</option>
                <option value="price-high">💎 Price: High to Low</option>
                <option value="name">🔤 Alphabetical</option>
              </select>

              <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 transition-all ${
                    viewMode === 'list'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">
                {debouncedSearchTerm
                  ? `Search Results: "${debouncedSearchTerm}"`
                  : selectedCategory === 'all'
                  ? 'All Fresh Products'
                  : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-slate-400">
                Showing <span className="text-emerald-400 font-semibold">{sortedProducts.length}</span> products
              </p>
            </div>

            {(debouncedSearchTerm || selectedCategory !== 'all' || priceRange.min || priceRange.max) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceRange({ min: '', max: '' });
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium border border-slate-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-24 h-24 border-8 border-transparent border-t-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-slate-400 text-xl mt-8 font-medium">Fetching fresh products...</p>
            <p className="text-slate-500 text-sm mt-2">This won't take long</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700">
            <div className="text-8xl mb-6 animate-bounce">🔍</div>
            <h3 className="text-3xl font-black text-white mb-4">No Products Found</h3>
            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
              We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceRange({ min: '', max: '' });
                setSortBy('newest');
              }}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }`}>
            {sortedProducts.map(product => (
              <ProductCard key={product._id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Floating Cart Button */}
      {cart && cart.length > 0 && (
        <button
          onClick={() => navigate('/cart')}
          className="fixed bottom-8 right-8 z-50 group"
        >
          <div className="relative">
            {/* Pulsing Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 animate-pulse"></div>
            
            {/* Main Button */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 transform group-hover:scale-110 transition-all duration-300 border border-emerald-400/50">
              <div className="relative">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white animate-bounce">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="text-left">
                <div className="font-black text-lg">View Cart</div>
                <div className="text-emerald-100 text-sm font-semibold">
                  ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </div>
              </div>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Floating Chat Interface */}
      <ChatInterface />
    </div>
  );
}

export default BuyerDashboard;
