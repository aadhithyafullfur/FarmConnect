import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatBox from './ChatBox';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5004';

const ChatInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ _id: payload.userId, role: payload.role || 'user' });
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchChatList();
      fetchUnreadCount();
    }
  }, [isOpen]);

  const fetchChatList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/messages/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatList(response.data);
    } catch (err) {
      console.error('Error fetching chat list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/messages/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = chatList.filter(chat =>
    chat.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedChat) {
    return (
      <ChatBox
        receiverId={selectedChat._id}
        receiverName={selectedChat.user.name}
        onClose={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <>
      {/* Enhanced Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-3 active:scale-95"
          title="Open Chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          
          {/* Enhanced Unread Badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
          
          {/* Floating Animation Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
        </button>
      </div>

      {/* Enhanced Chat List Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-700 overflow-hidden">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Messages</h3>
                <p className="text-sm opacity-90">{filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Chat List Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-slate-400 text-sm">Loading conversations...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-slate-200 font-semibold text-lg mb-2">
                  {searchTerm ? 'No matches found' : 'No conversations yet'}
                </h4>
                <p className="text-slate-400 text-sm">
                  {searchTerm 
                    ? `No conversations match "${searchTerm}"`
                    : `Start chatting with ${currentUser?.role === 'farmer' ? 'buyers' : 'farmers'} to see them here!`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredChats.map((chat) => {
                  const isUnread = chat.unreadCount > 0;
                  
                  return (
                    <div
                      key={chat._id}
                      onClick={() => setSelectedChat(chat)}
                      className="p-4 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-start space-x-3">
                        {/* Enhanced Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            isUnread 
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600' 
                              : 'bg-gradient-to-r from-slate-600 to-slate-700'
                          }`}>
                            {chat.user.name.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Online Status */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                          
                          {/* Unread Indicator */}
                          {isUnread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-semibold truncate ${isUnread ? 'text-slate-100' : 'text-slate-300'}`}>
                              {chat.user.name}
                            </h4>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {formatTime(chat.lastMessage.createdAt)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate pr-2 ${
                              isUnread ? 'text-slate-200 font-medium' : 'text-slate-400'
                            }`}>
                              {chat.lastMessage.content}
                            </p>
                            
                            {/* Unread Count Badge */}
                            {isUnread && chat.unreadCount > 0 && (
                              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs rounded-full px-2 py-1 font-bold min-w-[20px] text-center">
                                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                              </span>
                            )}
                          </div>
                          
                          {/* Role Badge */}
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              chat.user.role === 'farmer' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {chat.user.role === 'farmer' ? '🌱 Farmer' : '🛒 Buyer'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Enhanced Footer */}
          <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Click on any conversation to start chatting</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInterface;