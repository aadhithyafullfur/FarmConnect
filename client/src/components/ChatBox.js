import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

// eslint-disable-next-line no-unused-vars
const ChatBox = ({ recipientId, recipientName, receiverId, receiverName, onClose, currentUser }) => {
  // Support both naming conventions
  const chatRecipientId = recipientId || receiverId;
  const chatRecipientName = recipientName || receiverName;
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [receiverTyping, setReceiverTyping] = useState(false);
  const [receiverOnline, setReceiverOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Extract user ID from currentUser or JWT
  useEffect(() => {
    if (currentUser?._id || currentUser?.id) {
      setUserId(currentUser._id || currentUser.id);
    } else {
      // Extract from JWT token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.userId || payload.id || payload._id);
        } catch (err) {
          console.error('Error extracting user ID from token:', err);
        }
      }
    }
  }, [currentUser]);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, receiverTyping]);

  // Initialize Socket.io and fetch messages
  useEffect(() => {
    if (!userId) return; // Wait for userId to be set

    const token = localStorage.getItem('token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5003';

    // Initialize Socket.io
    const socketInstance = io(apiUrl, {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socketInstance;

    // Notify server that this user is connected
    socketInstance.on('connect', () => {
      console.log('✅ Socket.io connected:', socketInstance.id);
      socketInstance.emit('userConnected', { userId });
    });

    // Receive real-time messages
    socketInstance.on('newMessage', (data) => {
      // Add message if it's from the current conversation
      if (
        (data.senderId === chatRecipientId && data.recipientId === userId) ||
        (data.senderId === userId && data.recipientId === chatRecipientId)
      ) {
        setMessages(prev => [...prev, {
          _id: data._id || Date.now(),
          senderId: data.senderId,
          recipientId: data.recipientId,
          content: data.content,
          createdAt: data.createdAt || new Date(),
          delivered: data.delivered
        }]);
      }
    });

    // Receiver typing indicator
    socketInstance.on('userTyping', (data) => {
      if (data.userId === recipientId) {
        setReceiverTyping(true);
      }
    });

    // Receiver stopped typing
    socketInstance.on('userStoppedTyping', (data) => {
      if (data.userId === recipientId) {
        setReceiverTyping(false);
      }
    });

    // Online status
    socketInstance.on('userOnline', (data) => {
      if (data.userId === recipientId) {
        setReceiverOnline(true);
      }
    });

    // Offline status
    socketInstance.on('userOffline', (data) => {
      if (data.userId === recipientId) {
        setReceiverOnline(false);
      }
    });

    // Connection error
    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    // Fetch previous messages
    const fetchMessages = async () => {
      try {
        console.log('📥 Fetching messages from:', `${apiUrl}/api/messages/chat/${chatRecipientId}`);
        const response = await axios.get(
          `${apiUrl}/api/messages/chat/${chatRecipientId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log('✅ Messages fetched:', response.data);
        setMessages(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        setLoading(false);
      }
    };

    if (chatRecipientId) {
      fetchMessages();
    }

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRecipientId, userId]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!messageText.trim()) {
      console.warn('❌ Message text is empty');
      return;
    }

    if (!userId) {
      console.error('❌ userId is not set');
      alert('User information missing. Please refresh the page.');
      return;
    }

    if (!chatRecipientId) {
      console.error('❌ chatRecipientId is not set');
      alert('Recipient information missing.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token in localStorage');
      alert('Session expired. Please log in again.');
      return;
    }

    // Prepare message object
    const messageData = {
      senderId: userId,
      recipientId: chatRecipientId,
      content: messageText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      console.log('📤 Sending message to API:', messageData);
      console.log('🔗 URL: http://localhost:5003/api/messages');
      console.log('🔐 Token present: YES');

      // Send via HTTP
      const response = await axios.post(
        'http://localhost:5003/api/messages',
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('✅ Message sent successfully!');
      console.log('📝 Response:', response.data);

      // Add to local state immediately
      setMessages(prev => [...prev, response.data]);
      setMessageText('');

      // Emit via Socket.io for real-time
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('sendMessage', response.data);
        console.log('📡 Socket.io event emitted');
      }

      // Notify stopped typing
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('stoppedTyping', { recipientId: chatRecipientId });
      }

    } catch (error) {
      console.error('❌ FAILED TO SEND MESSAGE');
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });

      // Specific error handling
      if (!error.response) {
        // Network error
        alert('❌ Cannot connect to server!\n\nMake sure:\n1. Server is running\n2. Server is on port 5003\n3. Check: http://localhost:5003');
      } else if (error.response.status === 401) {
        alert('❌ Unauthorized!\n\nYour session expired. Please log in again.');
      } else if (error.response.status === 400) {
        alert(`❌ Bad Request:\n\n${error.response.data?.error || 'Invalid message data'}`);
      } else if (error.response.status === 404) {
        alert('❌ API endpoint not found!\n\nServer configuration issue.');
      } else if (error.response.status === 500) {
        alert(`❌ Server error:\n\n${error.response.data?.error || 'Internal server error'}`);
      } else {
        alert(`❌ Error: ${error.response.data?.error || error.message}`);
      }
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { recipientId: chatRecipientId });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to notify stopped typing
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stoppedTyping', { recipientId: chatRecipientId });
      }
    }, 1500);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-screen md:h-[600px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-emerald-600/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{(chatRecipientName || 'User').charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg leading-tight">{chatRecipientName || 'User'}</h3>
              <p className="text-emerald-50 text-xs font-medium">
                {receiverOnline ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Active now
                  </span>
                ) : (
                  <span className="text-slate-300">Offline</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-lg transition duration-200 active:scale-95"
        >
          ✕
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-emerald-600/50 scrollbar-track-slate-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600/30 border-t-emerald-600 mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-500 text-sm">No messages yet</p>
              <p className="text-slate-600 text-xs mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groupMessagesByDate()).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>
                  <span className="text-slate-500 text-xs font-semibold px-2">{date}</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>
                </div>

                {/* Messages for this date */}
                {dateMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'} mb-2 animate-fadeIn`}
                  >
                    {msg.senderId === userId ? (
                      // SENT MESSAGE - Professional Right-side Styling
                      <div className="max-w-xs group">
                        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 text-white rounded-3xl rounded-tr-none px-5 py-3 shadow-lg hover:shadow-emerald-600/50 transition duration-200">
                          <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1.5 px-2">
                          <p className="text-xs text-slate-500 font-medium">{formatTime(msg.createdAt)}</p>
                          {msg.delivered && (
                            <span className="text-xs text-emerald-400 font-bold">✓✓</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      // RECEIVED MESSAGE - Professional Left-side Styling
                      <div className="max-w-xs group">
                        <div className="bg-slate-800/80 border border-slate-700/50 text-slate-100 rounded-3xl rounded-tl-none px-5 py-3 shadow-lg hover:shadow-slate-700/50 hover:bg-slate-800 transition duration-200">
                          <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                        </div>
                        <div className="flex items-center justify-start gap-2 mt-1.5 px-2">
                          <p className="text-xs text-slate-500 font-medium">{formatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Typing indicator */}
            {receiverTyping && (
              <div className="flex justify-start mb-2">
                <div className="bg-slate-800/80 border border-slate-700/50 px-5 py-3 rounded-3xl rounded-tl-none shadow-lg">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-700/50 bg-gradient-to-b from-slate-900/80 to-slate-900 p-4 backdrop-blur-sm">
        <div className="flex gap-3 items-end">
          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 bg-slate-800/50 text-slate-100 placeholder-slate-500 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-slate-800/80 transition duration-200 resize-none text-sm"
            maxLength="500"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || !userId}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-semibold transition duration-200 shadow-lg hover:shadow-emerald-600/50 active:scale-95 text-sm"
          >
            Send
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-right font-medium">
          {messageText.length}/500
        </p>
      </form>
    </div>
  );
};

export default ChatBox;
