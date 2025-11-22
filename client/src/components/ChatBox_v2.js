import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatBoxV2 = ({ recipientId, recipientName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5004';

  // Get current user ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const uid = payload.userId || payload.id || payload._id;
        console.log('Current user ID:', uid);
        setUserId(uid);
      } catch (err) {
        console.error('Error parsing token:', err);
        setError('Authentication error');
      }
    }
  }, []);

  // Fetch messages on component mount or when recipient changes
  useEffect(() => {
    if (!userId || !recipientId) {
      console.log('Waiting for userId and recipientId');
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('Fetching messages:', {
          url: `${API_URL}/api/messages/chat/${recipientId}`,
          userId,
          recipientId
        });

        const response = await axios.get(
          `${API_URL}/api/messages/chat/${recipientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Messages fetched:', response.data);
        setMessages(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching messages:', err.response?.data || err.message);
        setError(`Failed to load messages: ${err.response?.data?.error || err.message}`);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, recipientId, API_URL]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (!recipientId) {
      setError('No recipient selected');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    setSending(true);

    try {
      console.log('Sending message:', {
        senderId: userId,
        recipientId,
        content: messageText
      });

      const response = await axios.post(
        `${API_URL}/api/messages`,
        {
          senderId: userId,
          recipientId,
          content: messageText
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Message sent successfully:', response.data);
      
      // Add to local messages
      setMessages(prev => [...prev, response.data]);
      setMessageText('');
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err.response?.data || err.message);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    setDeleting(messageId);
    const deleteUrl = `${API_URL}/api/messages/${messageId}`;
    console.log('Attempting to delete message:', { messageId, deleteUrl, API_URL });
    
    try {
      const response = await axios.delete(deleteUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Message deleted successfully:', response.data);
      
      // Remove from local state
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setError(null);
    } catch (err) {
      console.error('❌ Error deleting message:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: deleteUrl,
        data: err.response?.data,
        message: err.message
      });
      setError('Failed to delete message');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden border border-gray-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between shadow-lg flex-shrink-0">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {recipientName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{recipientName || 'User'}</h3>
            <p className="text-emerald-50/80 text-xs font-medium">Online</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-lg transition flex-shrink-0"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-gradient-to-b from-transparent to-gray-900/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-600/30 border-t-emerald-500 mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm font-medium">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400 text-sm font-medium">No messages yet</p>
              <p className="text-gray-500 text-xs mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isSent = msg.senderId === userId;
              return (
                <div
                  key={msg._id || idx}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fadeIn group`}
                  onMouseEnter={() => setHoveredMessageId(msg._id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div className={`max-w-xs lg:max-w-sm ${isSent ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2">
                      <div className={`px-4 py-2.5 rounded-xl text-sm font-medium break-words shadow-md transition-all hover:shadow-lg ${
                        isSent
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-none'
                          : 'bg-gray-700 text-gray-100 rounded-bl-none border border-gray-600'
                      }`}>
                        {msg.content}
                      </div>
                      {isSent && hoveredMessageId === msg._id && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          disabled={deleting === msg._id}
                          className="flex-shrink-0 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors p-1"
                          title="Delete message"
                        >
                          {deleting === msg._id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    <p className={`text-xs mt-1.5 font-medium ${
                      isSent ? 'text-right pr-2 text-gray-500' : 'text-left pl-2 text-gray-500'
                    }`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm p-4 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || loading}
            className="flex-1 bg-gray-700/70 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending || loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-all shadow-lg hover:shadow-xl flex-shrink-0"
            aria-label="Send message"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.353-1.956.353 6.002a1 1 0 101.986-.122l.353-6.002 5.353 1.956a1 1 0 001.169-1.409l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBoxV2;
