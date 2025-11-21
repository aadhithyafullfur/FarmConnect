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
    { id: 'all', name: 'All Products' },
    { id: 'vegetable', name: 'Vegetables' },
    { id: 'fruit', name: 'Fruits' },
    { id: 'grain', name: 'Grains' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'herbs', name: 'Herbs' },
    { id: 'nuts', name: 'Nuts' }
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
        className="bg-slate-800 rounded-lg border border-slate-700 shadow-md overflow-hidden group flex flex-col h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image - Square Shape */}
        <div className="relative w-full aspect-square bg-slate-700 overflow-hidden group">
          {!imageError && product.image ? (
            <img 
              src={product.image.startsWith('http') ? product.image : `http://localhost:5001${product.image}`} 
              alt={product.name}
              className="w-full h-full object-cover"
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
            <div className="w-full h-full flex items-center justify-center bg-slate-700">
              <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Wishlist Button */}
          <button
            onClick={() => toggleWishlist(product)}
            className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
              isProductInWishlist 
                ? 'bg-red-500 text-white' 
                : 'bg-slate-900/70 text-slate-300 hover:text-red-400'
            }`}
            title={isProductInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <svg className="w-5 h-5" fill={isProductInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Stock Badge */}
          {!inStock && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold">
              Out of Stock
            </div>
          )}

          {/* Organic Badge */}
          {product.organicCertified && (
            <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Organic
            </div>
          )}

          {/* Add to Cart Button - Show on Hover */}
          <div className={`absolute bottom-4 left-4 right-4 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`w-full py-2.5 px-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                inStock
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 flex-1 flex flex-col space-y-2">
          <h3 className="font-semibold text-white text-sm line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-slate-400 text-xs line-clamp-1">
            {product.description || 'Fresh produce'}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-emerald-400">
              ₹{product.price}
            </span>
            <span className="text-slate-500 text-xs">/{product.unit || 'kg'}</span>
          </div>

          {/* Stock Status */}
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold w-fit ${
            inStock 
              ? 'bg-emerald-500/20 text-emerald-300' 
              : 'bg-red-500/20 text-red-300'
          }`}>
            {inStock ? `${product.quantity} in stock` : 'Out of Stock'}
          </div>

          {/* Farmer Info */}
          <div className="flex items-center gap-1 text-xs text-slate-400 pt-1 border-t border-slate-700/40">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate">{product.farmerId?.name || 'Farm'}</span>
          </div>

          {/* Chat Button at Bottom with Different Color */}
          <ChatStarter
            userId={product.farmerId?._id}
            userName={product.farmerId?.name || 'Farmer'}
            buttonText=""
            className="mt-auto w-full py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat with Farmer
          </ChatStarter>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      {/* Toast Notification */}
      {addedToCart && (
        <div className="fixed top-24 right-6 z-50">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{addedToCart} added to cart</span>
          </div>
        </div>
      )}

      {/* Hero Banner with Search */}
      <div className="bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 pt-24 pb-12 border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Fresh Marketplace
            </h1>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
              Discover authentic, locally-sourced produce directly from farms near you
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={(e) => e.preventDefault()} className="bg-slate-800/80 border border-slate-700/40 rounded-xl shadow-2xl shadow-slate-900/50 overflow-hidden transition-all focus-within:border-emerald-500/40 backdrop-blur-sm">
              <div className="flex items-center px-5 py-3.5 gap-3">
                <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products, farmers, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm md:text-base"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-2 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-16 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollCategories('left')}
              className="hidden sm:flex flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              aria-label="Scroll categories left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {category.name}
                  {selectedCategory === category.id && (
                    <span className="hidden sm:inline ml-2 text-xs opacity-75">({sortedProducts.length})</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCategories('right')}
              className="hidden sm:flex flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              aria-label="Scroll categories right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Controls Bar */}
      <div className="bg-slate-900/30 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
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
                    className="hover:text-emerald-300 transition-colors"
                    aria-label="Clear category filter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Right - Sort & View */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="hidden md:block px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-medium focus:border-emerald-500 focus:outline-none hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">A-Z</option>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Results Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {debouncedSearchTerm
                  ? `Search Results: "${debouncedSearchTerm}"`
                  : selectedCategory === 'all'
                  ? 'Fresh Picks'
                  : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-slate-400 text-sm">
                <span className="text-emerald-400 font-semibold text-base">{sortedProducts.length}</span> {sortedProducts.length === 1 ? 'product' : 'products'} available
              </p>
            </div>

            {(debouncedSearchTerm || selectedCategory !== 'all' || priceRange.min || priceRange.max) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceRange({ min: '', max: '' });
                }}
                className="px-5 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-white rounded-lg transition-all font-medium border border-slate-700/50 flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-6">Loading products...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/40 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-2xl font-semibold text-white mb-3">No Products Found</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              No products match your current filters. Try adjusting your search criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceRange({ min: '', max: '' });
                setSortBy('newest');
              }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-max gap-4'
              : 'space-y-3'
          }`}>
            {sortedProducts.map(product => (
              <ProductCard key={product._id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart && cart.length > 0 && (
        <button
          onClick={() => navigate('/buyer/cart')}
          className="fixed bottom-8 right-8 z-40 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-4 rounded-xl shadow-2xl shadow-emerald-600/40 flex items-center gap-3 transition-all duration-300 text-base font-semibold hover:shadow-emerald-600/60 group"
        >
          <div className="relative">
            <svg className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-3 -right-3 bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-xl shadow-violet-600/50 border border-violet-400/60">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <div className="hidden md:block text-left">
            <div className="font-bold text-sm">Cart</div>
            <div className="text-xs opacity-95">
              ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}
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
