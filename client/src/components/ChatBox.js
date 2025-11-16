import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const ChatBox = ({ receiverId, receiverName, onClose, orderId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [receiverStatus, setReceiverStatus] = useState('offline');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Get current user from localStorage or context
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ _id: payload.userId });
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/messages/chat/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [receiverId]);

  useEffect(() => {
    if (currentUser && receiverId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll for new messages every 5 seconds
      return () => clearInterval(interval);
    }
  }, [receiverId, currentUser, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messages', {
        recipientId: receiverId,
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new message to the list immediately
      const newMsg = {
        ...response.data,
        senderId: currentUser._id,
        recipientId: receiverId,
        content: newMessage,
        createdAt: new Date().toISOString()
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
      setError(null);
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (date) => {
    return new Date(date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed bottom-0 right-4 w-96 h-[600px] bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-2xl flex flex-col z-50 border border-gray-200/50">
      {/* Enhanced Chat Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-t-2xl">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
              <span className="text-lg font-bold">{receiverName?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            {/* Online Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              receiverStatus === 'online' ? 'bg-green-400' : 'bg-gray-400'
            }`}></div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg">{receiverName || 'Chat'}</h3>
            <div className="flex items-center space-x-2 text-sm opacity-90">
              <div className={`w-2 h-2 rounded-full ${receiverStatus === 'online' ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="capitalize">{receiverStatus}</span>
              {orderId && <span>• Order #{orderId.slice(-8).toUpperCase()}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Minimize Button */}
          <button 
            onClick={() => {/* Add minimize functionality */}}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </button>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Enhanced Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/80 to-white/90" style={{ scrollBehavior: 'smooth' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={fetchMessages}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-gray-700 font-semibold text-lg mb-2">Start Your Conversation</h4>
            <p className="text-gray-500 text-sm">Send a message to {receiverName} to begin chatting</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isFirstMessageOfDay = index === 0 || 
                formatMessageDate(message.createdAt) !== formatMessageDate(messages[index - 1].createdAt);
              const isSentByMe = message.senderId === currentUser?._id;
              const isLastMessage = index === messages.length - 1;

              return (
                <div key={message._id || index}>
                  {/* Date Separator */}
                  {isFirstMessageOfDay && (
                    <div className="flex justify-center my-6">
                      <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-gray-600 border border-gray-200/50 shadow-sm">
                        {formatMessageDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-[80%] ${
                      isSentByMe 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-r-2xl rounded-tl-2xl rounded-bl-sm'
                    } px-4 py-3 shadow-lg relative transition-all duration-200 hover:shadow-xl`}>
                      
                      <p className="break-words leading-relaxed">{message.content}</p>
                      
                      {/* Message Status & Time */}
                      <div className={`flex items-center justify-end mt-2 space-x-1 ${
                        isSentByMe ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        
                        {/* Message Status Indicators (for sent messages) */}
                        {isSentByMe && (
                          <div className="flex items-center">
                            {isLastMessage && (
                              <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-r-2xl rounded-tl-2xl rounded-bl-sm px-4 py-3 shadow-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Enhanced Message Input */}
      <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200/50">
        <form onSubmit={sendMessage} className="space-y-3">
          {/* Input Field */}
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder={`Message ${receiverName}...`}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-500"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={sending}
              />
              
              {/* Character Count */}
              <div className="absolute bottom-1 right-3 text-xs text-gray-400">
                {newMessage.length}/500
              </div>
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                sending || !newMessage.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {sending ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-100 rounded border">Enter</kbd>
              <span>to send</span>
            </span>
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-100 rounded border">Shift+Enter</kbd>
              <span>for new line</span>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;