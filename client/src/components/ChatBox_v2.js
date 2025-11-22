import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatBoxV2 = ({ recipientId, recipientName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

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
      setError('Please enter a message');
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
      setError(`Failed to send message: ${err.response?.data?.error || err.message}`);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-screen md:h-[600px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-emerald-600/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg">{recipientName || 'User'}</h3>
          <p className="text-emerald-50 text-xs">Online</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-lg transition"
        >
          ✕
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600/30 border-t-emerald-600 mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-400 text-sm">{error}</p>
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
            {messages.map((msg, idx) => (
              <div
                key={msg._id || idx}
                className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'} mb-2`}
              >
                {msg.senderId === userId ? (
                  // Sent message
                  <div className="max-w-xs">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl rounded-tr-none px-5 py-3 shadow-lg">
                      <p className="text-sm font-medium break-words">{msg.content}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-right pr-2">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                ) : (
                  // Received message
                  <div className="max-w-xs">
                    <div className="bg-slate-800/80 border border-slate-700 text-slate-100 rounded-3xl rounded-tl-none px-5 py-3 shadow-lg">
                      <p className="text-sm font-medium break-words">{msg.content}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-left pl-2">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 text-white rounded-full px-4 py-2 text-sm border border-slate-700 focus:outline-none focus:border-emerald-600 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-full p-2 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBoxV2;
