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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
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

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      setIsLoadingNotifications(true);
      try {
        const data = await notificationService.getNotifications(1, 10);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    const loadUnreadCount = async () => {
      if (!user) return;
      
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    if (user) {
      // Connect to notification service
      notificationService.connect(user.id);
      
      // Request notification permission
      notificationService.requestPermission();
      
      // Add listener for new notifications
      notificationService.addListener('navbar', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Load initial notifications
      loadNotifications();
      loadUnreadCount();
    } else {
      // Disconnect when user logs out
      notificationService.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      notificationService.removeListener('navbar');
    };
  }, [user]);

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await notificationService.markAsRead(notification._id);
      setNotifications(prev => 
        prev.map(n => 
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate based on notification type
    if (notification.data?.orderId) {
      navigate(`/orders/${notification.data.orderId}`);
    }
    
    setIsNotificationOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsProfileOpen(false);
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

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

                {/* Notifications */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-700/50 group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-red-500/30 animate-pulse">
                        {unreadCount}
                      </div>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 overflow-hidden shadow-slate-900/50">
                      <div className="px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-700/80">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-200">
                            Notifications
                          </h3>
                          <div className="flex items-center space-x-3">
                            {unreadCount > 0 && (
                              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium border border-emerald-500/30">
                                {unreadCount} new
                              </span>
                            )}
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {isLoadingNotifications ? (
                          <div className="px-4 py-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
                            <p className="text-sm text-gray-400 mt-2">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm text-gray-400">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`px-4 py-3 hover:bg-gray-700/30 border-b border-gray-700/30 last:border-b-0 cursor-pointer transition-colors ${
                                !notification.isRead ? 'bg-green-500/5' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  !notification.isRead ? 'bg-green-400' : 'bg-gray-600'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-200">{notification.title}</p>
                                  <p className="text-sm text-gray-300 truncate">{notification.message}</p>
                                  <p className="text-xs text-gray-500">{notification.timeAgo || 'Just now'}</p>
                                </div>
                                {notification.priority === 'high' && (
                                  <div className="flex-shrink-0">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                      High
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-800/50">
                        <button 
                          onClick={() => {
                            navigate('/notifications');
                            setIsNotificationOpen(false);
                          }}
                          className="text-xs text-green-400 hover:text-green-300 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800/95 backdrop-blur-md border-t border-gray-700/50">
          <div className="px-4 py-4 space-y-2">
            <Link 
              to="/" 
              className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActiveLink('/') 
                  ? 'text-green-400 bg-green-500/10' 
                  : 'text-gray-300 hover:text-green-400 hover:bg-gray-700/50'
              }`}
            >
              Home
            </Link>
            <button 
              onClick={handleMarketplaceClick}
              className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:text-green-400 hover:bg-gray-700/50"
            >
              Marketplace
            </button>
            <Link 
              to="/about" 
              className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActiveLink('/about') 
                  ? 'text-green-400 bg-green-500/10' 
                  : 'text-gray-300 hover:text-green-400 hover:bg-gray-700/50'
              }`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActiveLink('/contact') 
                  ? 'text-green-400 bg-green-500/10' 
                  : 'text-gray-300 hover:text-green-400 hover:bg-gray-700/50'
              }`}
            >
              Contact
            </Link>
            
            {/* Driver Portal now accessible through main login with driver role */}

            {/* Buyer Dashboard Specific Features - Mobile */}
            {isBuyerDashboard() && (
              <div className="pt-2 border-t border-gray-700/50 space-y-2">
                <div className="px-3 py-2 text-xs font-semibold text-green-400 uppercase tracking-wider">
                  Quick Actions
                </div>
                
                <button 
                  onClick={() => navigate('/buyer/cart')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:text-orange-400 hover:bg-gray-700/50"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    <span>Shopping Cart</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={handleWishlistClick}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:text-pink-400 hover:bg-gray-700/50"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span>Wishlist</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => navigate('/buyer/orders')}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:text-blue-400 hover:bg-gray-700/50"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5zM8.5 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
                  </svg>
                  <span>My Orders</span>
                </button>
              </div>
            )}
            
            {!user && (
              <div className="pt-4 border-t border-gray-700/50 space-y-2">
                <Link to="/login" className="block">
                  <button className="w-full px-3 py-2 text-sm font-medium text-center rounded-lg border border-green-500/50 text-green-400 hover:bg-green-500/10">
                    Sign In
                  </button>
                </Link>
                <Link to="/register" className="block">
                  <button className="w-full px-3 py-2 text-sm font-medium text-center rounded-lg bg-green-500 text-white hover:bg-green-600">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
