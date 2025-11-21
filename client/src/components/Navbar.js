import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useShoppingContext } from "../context/ShoppingContext";
import notificationService from "../services/notificationService";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { 
    cart, 
    wishlist, 
    getCartItemsCount, 
    performGlobalSearch, 
    searchTerm: globalSearchTerm,
    clearSearch 
  } = useShoppingContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    // Disconnect from notification service
    notificationService.disconnect();
    navigate("/login");
  };

  // Function to handle marketplace navigation based on user role
  const handleMarketplaceClick = () => {
    if (!user) {
      // If user is not logged in, redirect to login
      navigate('/login');
      return;
    }

    // Route based on user role
    if (user.role === 'farmer') {
      navigate('/farmer/dashboard');
    } else if (user.role === 'buyer') {
      navigate('/buyer/dashboard');
    } else {
      // Default fallback
      navigate('/buyer/dashboard');
    }
  };

  // Function to handle logo click and navigate to home
  const handleLogoClick = () => {
    navigate('/');
  };

  // Check if current page is buyer dashboard
  const isBuyerDashboard = () => {
    return user?.role === 'buyer' && (
      location.pathname === '/buyer/dashboard' || 
      location.pathname === '/buyer-dashboard'
    );
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Debounce search to avoid too many API calls
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      performGlobalSearch(value);
    }, 300);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performGlobalSearch(searchInput);
    
    // If not on buyer dashboard, navigate there
    if (!isBuyerDashboard()) {
      navigate('/buyer/dashboard');
    }
  };

  // Clear search functionality
  const handleClearSearch = () => {
    setSearchInput('');
    clearSearch();
  };

  // Update cart and wishlist counts from context
  useEffect(() => {
    setCartCount(getCartItemsCount());
    setWishlistCount(wishlist.length);
  }, [cart, wishlist, getCartItemsCount]);

  // Update search input when global search term changes
  useEffect(() => {
    if (globalSearchTerm !== searchInput) {
      setSearchInput(globalSearchTerm);
    }
  }, [globalSearchTerm, searchInput]);

  // Listen for cart/wishlist updates from other components
  useEffect(() => {
    const handleCartUpdate = (event) => {
      const updatedCart = event.detail;
      const count = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    const handleWishlistUpdate = (event) => {
      const updatedWishlist = event.detail;
      setWishlistCount(updatedWishlist.length);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  // Handle wishlist navigation
  const handleWishlistClick = () => {
    navigate('/buyer/wishlist');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const NavLink = ({ to, children, className = "" }) => (
    <Link
      to={to}
      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl group ${
        isActiveLink(to)
          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
          : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50'
      } ${className}`}
    >
      {children}
      {isActiveLink(to) && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20"></div>
      )}
    </Link>
  );

  return (
    <nav className="bg-slate-900 border-b border-slate-700 fixed w-full z-50 top-0 shadow-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <button 
              onClick={handleLogoClick}
              className="flex items-center group cursor-pointer bg-transparent border-none outline-none transition-all duration-300"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
              </div>
              <div className="ml-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                    FarmConnect
                  </span>
                  <span className="text-lg">🌾</span>
                </div>
                <div className="text-xs text-slate-400 font-medium -mt-0.5">
                  Farm to Table Platform
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Home</span>
              </span>
            </NavLink>
            
            <button onClick={handleMarketplaceClick} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60 rounded-xl transition-all duration-200 group">
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span>Marketplace</span>
            </button>
            
            <NavLink to="/about">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>About</span>
              </span>
            </NavLink>
            
            <NavLink to="/contact">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>Contact</span>
              </span>
            </NavLink>

            {/* Chat Link (for testing) */}
            {user && (
              <NavLink to="/chat">
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span>Chat</span>
                </span>
              </NavLink>
            )}
            
            {/* Driver Portal now accessible through main login with driver role */}

            {/* Buyer Dashboard Specific Features */}
            {isBuyerDashboard() && (
              <>
                {/* Enhanced Search Bar for Products */}
                <div className="mx-4 px-1">
                  <div className="w-px h-6 bg-slate-700"></div>
                </div>
                
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <div className="relative flex items-center bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 px-4 py-2.5 shadow-lg shadow-slate-900/20 transition-all duration-300 hover:border-slate-600/50 focus-within:border-emerald-500/50 focus-within:shadow-emerald-500/10">
                    <svg className="w-4 h-4 text-slate-400 mr-3 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Search fresh products..." 
                      value={searchInput}
                      onChange={handleSearchChange}
                      className="bg-transparent text-sm text-slate-200 placeholder-slate-400 border-none outline-none w-48 focus:w-56 transition-all duration-300 font-medium"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="ml-2 p-1 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </form>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Cart Quick Access */}
                  <button 
                    onClick={() => navigate('/buyer/cart')}
                    className="relative flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-orange-400 hover:bg-slate-800/60 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-700/50 group"
                  >
                    <div className="relative">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                      {cartCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-orange-500/30 animate-pulse">
                          {cartCount}
                        </div>
                      )}
                    </div>
                    <span className="hidden sm:block">Cart</span>
                  </button>

                  {/* Wishlist Quick Access */}
                  <button 
                    onClick={handleWishlistClick}
                    className="relative flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-pink-400 hover:bg-slate-800/60 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-700/50 group"
                  >
                    <div className="relative">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {wishlistCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-pink-500/30 animate-pulse">
                          {wishlistCount}
                        </div>
                      )}
                    </div>
                    <span className="hidden sm:block">Wishlist</span>
                  </button>

                  {/* Orders Quick Access */}
                  <button 
                    onClick={() => navigate('/buyer/orders')}
                    className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-blue-400 hover:bg-slate-800/60 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-700/50 group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:block">Orders</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {!user ? (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <button className="px-5 py-2.5 text-sm font-medium rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 backdrop-blur-sm">
                    Sign In
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white hover:from-emerald-700 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 border border-emerald-500/20">
                    Get Started
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Chat */}
                <Link to="/chat">
                  <button className="relative p-2.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-700/50 group">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </Link>

                {/* User Profile */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 p-2 hover:bg-slate-800/60 transition-all duration-300 group border border-transparent hover:border-slate-700/50"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-slate-200">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-400 capitalize font-medium">
                        {user.role}
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 overflow-hidden shadow-slate-900/50">
                      <div className="px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-700/80">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate font-medium">{user.email}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 capitalize mt-1 border border-emerald-500/30">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          to={user.role === "buyer" ? "/buyer" : "/farmer"}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-green-400 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          Dashboard
                        </Link>
                        
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-green-400 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          Profile Settings
                        </Link>

                        <div className="border-t border-gray-700/50 my-2"></div>

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
