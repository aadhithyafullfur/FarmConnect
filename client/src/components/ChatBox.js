import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const ChatBox = ({ receiverId, receiverName, onClose, orderId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
    <div className="fixed bottom-0 right-4 w-96 bg-white rounded-t-lg shadow-2xl flex flex-col z-50">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
        <div>
          <h3 className="font-semibold">{receiverName}</h3>
          {orderId && <p className="text-sm opacity-75">Order #{orderId.slice(-8).toUpperCase()}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-full transition duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 h-96 bg-gray-50" style={{ scrollBehavior: 'smooth' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isFirstMessageOfDay = index === 0 || 
                formatMessageDate(message.createdAt) !== formatMessageDate(messages[index - 1].createdAt);
              const isSentByMe = message.senderId === currentUser?._id;

              return (
                <div key={message._id || index}>
                  {isFirstMessageOfDay && (
                    <div className="flex justify-center my-4">
                      <span className="px-4 py-1 bg-gray-200 rounded-full text-sm text-gray-600">
                        {formatMessageDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isSentByMe ? 'bg-blue-600 text-white' : 'bg-white'} rounded-lg px-4 py-2 shadow`}>
                      <p className="break-words">{message.content}</p>
                      <p className={`text-xs ${isSentByMe ? 'text-blue-200' : 'text-gray-500'} mt-1`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className={`p-2 rounded-full ${
              sending || !newMessage.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition duration-200`}
          >
            {sending ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;