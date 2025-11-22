import React, { useState, useEffect } from 'react';
import ChatInterface from '../../components/ChatInterface';
import ChatStarter from '../../components/ChatStarter';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

const ChatTest = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    farmers: 0,
    buyers: 0
  });

  useEffect(() => {
    // Get current user and fetch users
    const token = localStorage.getItem('token');
    let currentUserData = null;
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserData = { _id: payload.userId, name: payload.name || 'Current User' };
        setCurrentUser(currentUserData);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }

    // Fetch users
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filteredUsers = response.data.filter(user => user._id !== currentUserData?._id);
        setUsers(filteredUsers);
        
        // Calculate stats
        setStats({
          totalUsers: filteredUsers.length,
          farmers: filteredUsers.filter(u => u.role === 'farmer').length,
          buyers: filteredUsers.filter(u => u.role === 'buyer').length
        });
      } catch (err) {
        console.error('Error fetching users:', err);
        // For demo purposes, create some dummy users if API fails
        const dummyUsers = [
          { _id: '1', name: 'John Farmer', role: 'farmer' },
          { _id: '2', name: 'Sarah Buyer', role: 'buyer' },
          { _id: '3', name: 'Mike Producer', role: 'farmer' },
          { _id: '4', name: 'Emma Green', role: 'buyer' },
          { _id: '5', name: 'Tom Organic', role: 'farmer' }
        ];
        setUsers(dummyUsers);
        setStats({
          totalUsers: dummyUsers.length,
          farmers: dummyUsers.filter(u => u.role === 'farmer').length,
          buyers: dummyUsers.filter(u => u.role === 'buyer').length
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Loading Chat Interface</h3>
            <p className="text-gray-400">Preparing your conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
              💬 Professional Chat
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Connect instantly with farmers and buyers. Experience real-time messaging with our advanced chat platform.
            </p>
          </div>

          {/* Current User Welcome Card */}
          {currentUser && (
            <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-2xl shadow-2xl p-6 mb-8 border border-gray-700 backdrop-blur-sm">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Welcome, {currentUser.name}!</h2>
                  <p className="text-gray-400">Ready to connect with the community</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-xl p-4 border border-emerald-700/30">
                <p className="text-gray-300 leading-relaxed">
                  🚀 <strong>Get started:</strong> Use the floating chat button or select any user below to begin a conversation. 
                  All messages are saved and you can continue anytime!
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-700 backdrop-blur-sm hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Users</p>
                  <p className="text-4xl font-bold text-emerald-400 mt-2">{stats.totalUsers}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-700 backdrop-blur-sm hover:border-green-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Farmers</p>
                  <p className="text-4xl font-bold text-green-400 mt-2">{stats.farmers}</p>
                </div>
                <div className="w-14 h-14 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                  <span className="text-3xl">🌱</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-700 backdrop-blur-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Buyers</p>
                  <p className="text-4xl font-bold text-blue-400 mt-2">{stats.buyers}</p>
                </div>
                <div className="w-14 h-14 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <span className="text-3xl">🛒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-2xl shadow-xl p-6 mb-8 border border-gray-700 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterRole('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterRole === 'all'
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All ({stats.totalUsers})
                </button>
                <button
                  onClick={() => setFilterRole('farmer')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterRole === 'farmer'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🌱 Farmers ({stats.farmers})
                </button>
                <button
                  onClick={() => setFilterRole('buyer')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterRole === 'buyer'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🛒 Buyers ({stats.buyers})
                </button>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-2xl shadow-xl p-6 border border-gray-700 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Available Users</h2>
              <span className="text-sm text-gray-400">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </span>
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">No users found</h3>
                <p className="text-gray-400">
                  {searchTerm ? `No users match "${searchTerm}"` : 'No users available to chat with'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="group bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-6 hover:shadow-2xl hover:border-emerald-500/50 transition-all duration-300 transform hover:-translate-y-1 border border-gray-700">
                    <div className="flex flex-col items-center text-center">
                      {/* User Avatar */}
                      <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg ${
                        user.role === 'farmer' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                        
                        {/* Role Badge */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          user.role === 'farmer' ? 'bg-green-600' : 'bg-blue-600'
                        }`}>
                          {user.role === 'farmer' ? '🌱' : '🛒'}
                        </div>
                      </div>
                      
                      {/* User Info */}
                      <h3 className="font-bold text-lg text-white mb-1">{user.name}</h3>
                      <p className={`text-sm font-medium mb-4 px-3 py-1 rounded-full ${
                        user.role === 'farmer' 
                          ? 'bg-green-900/50 text-green-300 border border-green-700/50' 
                          : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                      }`}>
                        {user.role === 'farmer' ? '🌱 Farmer' : '🛒 Buyer'}
                      </p>
                      
                      {/* Chat Button */}
                      <ChatStarter
                        userId={user._id}
                        userName={user.name}
                        buttonText="💬 Start Chat"
                        className="w-full justify-center group-hover:scale-105"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-12 bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-2xl shadow-xl p-8 border border-gray-700 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-center text-white mb-8">Advanced Chat Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg text-white mb-2">Real-time Messaging</h4>
                <p className="text-gray-400">Instant message delivery with Socket.IO technology</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg text-white mb-2">Message Persistence</h4>
                <p className="text-gray-400">All conversations saved securely in the database</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg text-white mb-2">Professional UI</h4>
                <p className="text-gray-400">Beautiful, modern chat interface with great UX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Chat Interface */}
      <ChatInterface />
    </div>
  );
};

export default ChatTest;