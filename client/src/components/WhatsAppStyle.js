import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const WhatsAppStyle = ({ onClose }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5004';

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId || payload.id || payload._id);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  // Fetch chat list
  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/messages/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChats(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setLoading(false);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [userId, API_URL]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat || !userId) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/api/messages/chat/${selectedChat._id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setMessages(response.data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [selectedChat, userId, API_URL]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || !userId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/messages`,
        {
          senderId: userId,
          recipientId: selectedChat._id,
          content: messageText
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessages(prev => [...prev, response.data]);
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Filter chats by search
  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="fixed bottom-24 left-6 w-screen md:w-[900px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between shadow-md">
        <h2 className="text-xl font-bold text-white">💬 Chats</h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-lg transition"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List (Left Sidebar) */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="🔍 Search chats..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-4 py-2 bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Chat Items */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Loading chats...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No chats yet</p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition ${
                    selectedChat?._id === chat._id
                      ? 'bg-green-50 border-l-4 border-l-green-500'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {/* Chat Item */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {chat.name?.[0]?.toUpperCase()}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {chat.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {chat.unreadCount > 0 && (
                      <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <p className="text-xs text-gray-400 mt-1">
                    {chat.lastMessage?.createdAt
                      ? new Date(chat.lastMessage.createdAt).toLocaleDateString()
                      : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Area (Right Side) */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {selectedChat.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedChat.name}
                    </h3>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div
                        key={msg._id || idx}
                        className={`flex ${
                          msg.senderId === userId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-3xl ${
                            msg.senderId === userId
                              ? 'bg-green-500 text-white rounded-br-none'
                              : 'bg-gray-200 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.senderId === userId
                                ? 'text-green-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-200 bg-white p-4 flex gap-2"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-full p-3 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.353-1.956.353 6.002a1 1 0 101.986-.122l.353-6.002 5.353 1.956a1 1 0 001.169-1.409l-7-14z" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppStyle;
