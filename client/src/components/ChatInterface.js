import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatBox from './ChatBox';

const ChatInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
      const response = await axios.get('/api/messages/chats', {
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
      const response = await axios.get('/api/messages/unread', {
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
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition duration-300 relative"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat List Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-lg shadow-2xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold">Messages</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded-full transition duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : chatList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No conversations yet</p>
                <p className="text-sm">Start chatting with farmers or buyers!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {chatList.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {chat.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">
                            {chat.user.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessage.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInterface;