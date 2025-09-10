import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

const ShoppingContext = createContext();

export const useShoppingContext = () => {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShoppingContext must be used within a ShoppingContextProvider');
  }
  return context;
};

export const ShoppingContextProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart and wishlist from localStorage on mount
  useEffect(() => {
    loadCart();
    loadWishlist();
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0 || localStorage.getItem('cart')) {
      localStorage.setItem('cart', JSON.stringify(cart));
      // Trigger custom event for navbar updates
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    }
  }, [cart]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlist.length > 0 || localStorage.getItem('wishlist')) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      // Trigger custom event for navbar updates
      window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: wishlist }));
    }
  }, [wishlist]);

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart([]);
    }
  };

  const loadWishlist = () => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        setWishlist(parsedWishlist);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    }
  };

  const addToCart = (product, quantity = 1) => {
    try {
      const existingItem = cart.find(item => item._id === product._id);
      let newCart;
      
      if (existingItem) {
        newCart = cart.map(item => 
          item._id === product._id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...cart, { ...product, quantity }];
      }
      
      setCart(newCart);
      
      // Show success notification
      showNotification(`${product.name} added to cart!`, 'success');
      
      return { success: true, message: 'Product added to cart' };
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Failed to add product to cart', 'error');
      return { success: false, message: 'Failed to add to cart' };
    }
  };

  const removeFromCart = (productId) => {
    try {
      const newCart = cart.filter(item => item._id !== productId);
      setCart(newCart);
      showNotification('Product removed from cart', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      showNotification('Failed to remove product from cart', 'error');
      return { success: false };
    }
  };

  const updateCartQuantity = (productId, quantity) => {
    try {
      if (quantity <= 0) {
        return removeFromCart(productId);
      }
      
      const newCart = cart.map(item => 
        item._id === productId 
          ? { ...item, quantity }
          : item
      );
      
      setCart(newCart);
      return { success: true };
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      return { success: false };
    }
  };

  const clearCart = () => {
    try {
      setCart([]);
      localStorage.removeItem('cart');
      showNotification('Cart cleared', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false };
    }
  };

  const toggleWishlist = (product) => {
    try {
      const isInWishlist = wishlist.some(item => item._id === product._id);
      let newWishlist;
      
      if (isInWishlist) {
        newWishlist = wishlist.filter(item => item._id !== product._id);
        showNotification(`${product.name} removed from wishlist`, 'success');
      } else {
        newWishlist = [...wishlist, product];
        showNotification(`${product.name} added to wishlist`, 'success');
      }
      
      setWishlist(newWishlist);
      return { success: true, isInWishlist: !isInWishlist };
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showNotification('Failed to update wishlist', 'error');
      return { success: false };
    }
  };

  const removeFromWishlist = (productId) => {
    try {
      const newWishlist = wishlist.filter(item => item._id !== productId);
      setWishlist(newWishlist);
      showNotification('Product removed from wishlist', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false };
    }
  };

  const moveToCartFromWishlist = (product) => {
    try {
      const result = addToCart(product);
      if (result.success) {
        removeFromWishlist(product._id);
        showNotification(`${product.name} moved to cart`, 'success');
      }
      return result;
    } catch (error) {
      console.error('Error moving to cart:', error);
      return { success: false };
    }
  };

  const isInCart = (productId) => {
    return cart.some(item => item._id === productId);
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  const getCartItemQuantity = (productId) => {
    const item = cart.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const showNotification = (message, type = 'info') => {
    // Create a custom event for notifications
    window.dispatchEvent(new CustomEvent('showNotification', { 
      detail: { message, type } 
    }));
  };

  // Global search functionality
  const performGlobalSearch = (term, categoryFilter = 'all') => {
    setSearchTerm(term);
    setSelectedCategory(categoryFilter);
    
    // Trigger search event for components to listen to
    window.dispatchEvent(new CustomEvent('globalSearch', { 
      detail: { searchTerm: term, category: categoryFilter } 
    }));
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    window.dispatchEvent(new CustomEvent('globalSearch', { 
      detail: { searchTerm: '', category: 'all' } 
    }));
  };

  const value = {
    // Cart state and methods
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isInCart,
    getCartItemQuantity,
    getCartTotal,
    getCartItemsCount,
    
    // Wishlist state and methods
    wishlist,
    toggleWishlist,
    removeFromWishlist,
    moveToCartFromWishlist,
    isInWishlist,
    
    // Search state and methods
    searchTerm,
    selectedCategory,
    performGlobalSearch,
    clearSearch,
    
    // Products state
    products,
    setProducts,
    
    // Loading state
    isLoading,
    setIsLoading,
    
    // Utility methods
    showNotification,
    loadCart,
    loadWishlist
  };

  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
};

export default ShoppingContext;
