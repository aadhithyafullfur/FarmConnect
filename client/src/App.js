import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import NotificationToast from './components/NotificationToast';
import ServerStatus from './components/ServerStatus';
import AutoServerService from './services/AutoServerService';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import Cart from './pages/buyer/Cart';
import BuyerOrders from './pages/buyer/BuyerOrders';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import AddProduct from './pages/farmer/AddProductNew';
import Profile from './pages/shared/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

import Home from './pages/Home';
import { AuthProvider } from './context/AuthContext';
import { ShoppingContextProvider } from './context/ShoppingContext';
import testApi from './test-api';


function NotFound() {
  const location = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">404 - Not Found</h1>
      <p className="text-lg text-gray-400 mb-4">No route matches <span className="font-mono bg-gray-800 px-2 py-1 rounded">{location.pathname}</span></p>
      <Link to="/" className="text-green-400 hover:underline">Go Home</Link>
    </div>
  );
}

function App() {
  // Make test API available globally for debugging
  React.useEffect(() => {
    window.testApi = testApi;
    console.log('Test API function available as window.testApi()');
    
    // Initialize auto-server recovery service (but don't start it automatically)
    const autoServer = new AutoServerService();
    window.autoServerService = autoServer;
    console.log('🔄 Auto-server recovery service available (call window.autoServerService.startAutoRecovery() to enable)');
    
    return () => {
      if (autoServer.isMonitoring) {
        autoServer.stopAutoRecovery();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <ShoppingContextProvider>
        <Router>
          <div className="min-h-screen bg-gray-900 text-gray-100">
            <ServerStatus />
            <Navbar />
            <NotificationToast />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                
                {/* Buyer Routes */}
                <Route path="/buyer" element={<ProtectedRoute role="buyer"><BuyerDashboard /></ProtectedRoute>} />
                <Route path="/buyer/dashboard" element={<ProtectedRoute role="buyer"><BuyerDashboard /></ProtectedRoute>} />
                <Route path="/buyer-dashboard" element={<ProtectedRoute role="buyer"><BuyerDashboard /></ProtectedRoute>} />
                <Route path="/buyer/cart" element={<ProtectedRoute role="buyer"><Cart /></ProtectedRoute>} />
                <Route path="/buyer/orders" element={<ProtectedRoute role="buyer"><BuyerOrders /></ProtectedRoute>} />
                
                {/* Farmer Routes */}
                <Route path="/farmer" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
                <Route path="/farmer/dashboard" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
                <Route path="/farmer-dashboard" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
                <Route path="/farmer/add-product" element={<ProtectedRoute role="farmer"><AddProduct /></ProtectedRoute>} />
                
                {/* Shared Routes */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ShoppingContextProvider>
    </AuthProvider>
  );
}

export default App;