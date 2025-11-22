import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { showSuccess } from '../utils/notifications';

const ChatBoxContainer = ({ onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [userId, setUserId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = payload.userId || payload.id || payload._id;
        console.log('✅ User ID:', id);
        setUserId(id);
      } catch (err) {
        console.error('❌ Error parsing token:', err);
      }
    }
  }, []);

  // Fetch conversations from message chats endpoint
  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('📥 Fetching conversations...');
        
        const response = await axios.get(`${API_URL}/api/messages/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const chats = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Got conversations:', chats);
        setConversations(chats);
        
        // Auto-select first conversation
        if (chats.length > 0) {
          setSelectedConversation(chats[0]);
        }
      } catch (err) {
        console.error('❌ Error fetching conversations:', err.message);
      }
    };

    // Fetch immediately
    fetchConversations();
    
    // Then refresh every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [userId, API_URL]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !userId) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log(`📨 Fetching messages for ${selectedConversation._id}...`);
        
        const response = await axios.get(
          `${API_URL}/api/messages/chat/${selectedConversation._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const msgs = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Got ${msgs.length} messages`);
        
        // Check if new messages arrived
        if (msgs.length > previousMessageCount) {
          const newMessagesCount = msgs.length - previousMessageCount;
          // Check if the new messages are from the other person (not current user)
          const latestMessages = msgs.slice(-newMessagesCount);
          const hasIncomingMessages = latestMessages.some(msg => msg.senderId !== userId);
          
          if (hasIncomingMessages) {
            const senderName = selectedConversation.name || 'Someone';
            const lastMessage = msgs[msgs.length - 1];
            showSuccess(`New message from ${senderName}: "${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}"`);
          }
          
          setPreviousMessageCount(msgs.length);
        }
        
        setMessages(msgs);
      } catch (err) {
        console.error('❌ Error fetching messages:', err.message);
        setMessages([]);
      }
    };

    // Fetch immediately
    fetchMessages();
    
    // Then refresh every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedConversation, userId, API_URL, previousMessageCount]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !userId) return;

    const content = messageText;
    setMessageText('');

    // Show message immediately
    const tempMsg = {
      _id: 'temp_' + Date.now(),
      senderId: userId,
      recipientId: selectedConversation._id,
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const token = localStorage.getItem('token');
      console.log('📤 Sending message...');
      
      const response = await axios.post(
        `${API_URL}/api/messages`,
        {
          senderId: userId,
          recipientId: selectedConversation._id,
          content
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Message sent!');
      showSuccess('Message sent successfully!');
      // Replace temp with real message
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? response.data : m));
    } catch (err) {
      console.error('❌ Error sending message:', err.message);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-300 flex flex-col" style={{ maxHeight: '600px' }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 rounded-t-xl">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          </svg>
          <h2 className="font-bold">Messages</h2>
        </div>
        <button onClick={onClose} className="hover:bg-green-700 p-1 rounded transition">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        
        {/* Conversation List */}
        <div className="w-40 border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
          <div className="p-2 border-b border-gray-200 flex-shrink-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {conversations.length === 0 ? (
              <div className="flex items-center justify-center h-full p-3">
                <p className="text-xs text-gray-400 text-center">No conversations</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-2 border-b border-gray-200 cursor-pointer transition ${
                    selectedConversation?._id === conv._id
                      ? 'bg-green-100 border-l-4 border-l-green-500'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {conv.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-xs truncate">{conv.name}</p>
                      <p className="text-gray-500 text-xs truncate">{conv.lastMessage?.content || 'No msg'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {selectedConversation.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-xs">{selectedConversation.name}</p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-gray-400">Start chatting!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isSent = msg.senderId === userId;
                      return (
                        <div key={msg._id || idx} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                            isSent
                              ? 'bg-green-500 text-white rounded-br-none'
                              : 'bg-gray-300 text-gray-900 rounded-bl-none'
                          }`}>
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isSent ? 'text-green-100' : 'text-gray-600'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white p-2 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type..."
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                />
                <button type="submit" disabled={!messageText.trim()} className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-full p-1.5 transition flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.353-1.956.353 6.002a1 1 0 101.986-.122l.353-6.002 5.353 1.956a1 1 0 001.169-1.409l-7-14z" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-xs">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBoxContainer;
