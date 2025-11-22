import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { showSuccess } from '../utils/notifications';

// Gemini AI Integration
let googleGenAI = null;
let model = null;

try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  googleGenAI = new GoogleGenerativeAI('AIzaSyDtRgP_FASM7Rg15N-rH1VYclg93XjdrNE');
  model = googleGenAI.getGenerativeModel({ model: 'gemini-pro' });
} catch (err) {
  console.warn('⚠️ Gemini AI not configured, will use basic responses');
}

const ChatBoxContainer = ({ onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [userId, setUserId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

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
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (err) {
        console.error('❌ Error fetching messages:', err.message);
      }
    };

    // Fetch immediately
    fetchMessages();
    
    // Then refresh every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedConversation, userId, previousMessageCount, API_URL]);

  const generateAIResponse = async (userMessage) => {
    try {
      setAiLoading(true);
      
      // 1. Check if crop order
      const orderKeywords = ['order', 'buy', 'purchase', 'want', 'need', 'book', 'crop', 'kg', 'ton'];
      const isOrderRequest = orderKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );
      
      // 2. Build AI prompt
      let aiPrompt = `You are AgriBot Pro, an intelligent agricultural assistant helping farmers. You are knowledgeable about crops, farming techniques, and crop ordering.`;
      
      if (isOrderRequest) {
        aiPrompt += `\n\nThe user wants to order crops. Please help them order crops. Extract and confirm: crop type, quantity, and delivery date. Be helpful and professional.`;
      } else {
        aiPrompt += `\n\nProvide helpful agricultural advice about farming, crops, and best practices. Be friendly and professional.`;
      }
      
      aiPrompt += `\n\nUser message: "${userMessage}"`;
      
      // 3. Call Gemini API
      if (model) {
        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        return response.text();
      } else {
        // Fallback responses
        if (isOrderRequest) {
          return `I'd be happy to help you order crops! Please provide me with:\n- Crop name (e.g., tomatoes, wheat, rice)\n- Quantity (in kg or tons)\n- Preferred delivery date\n\nI'll process your order right away!`;
        } else {
          return `I'm here to help! You asked: "${userMessage}". For best results, please ask about specific crops, farming techniques, or crop ordering. How can I assist you today?`;
        }
      }
    } catch (err) {
      console.error('❌ Error generating AI response:', err);
      return `I'm here to help! Please ask about crops, farming advice, or to order seeds. How can I assist you?`;
    } finally {
      setAiLoading(false);
    }
  };


  const processCropOrder = async (userMessage) => {
    try {
      setIsProcessingOrder(true);
      
      // 1. Extract order details (for future use in order processing)
      // const orderDetails = extractOrderDetails(userMessage);
      
      // 2. Get AI response
      const aiResponse = await generateAIResponse(userMessage);
      
      // 3. Create assistant message
      const tempAssistantMsg = {
        _id: 'temp_ai_' + Date.now(),
        senderId: 'agribot-pro',
        recipientId: selectedConversation._id,
        content: aiResponse,
        createdAt: new Date().toISOString(),
        isAI: true
      };
      
      // 4. Add to messages
      setMessages(prev => [...prev, tempAssistantMsg]);
      
      // 5. Auto-scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      return true;
    } catch (err) {
      console.error('❌ Error processing order:', err);
      return false;
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleSendMessageWithAI = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !userId) return;

    const content = messageText;
    setMessageText('');

    // 1. Show user message immediately
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
      
      // 2. Send to server
      const response = await axios.post(`${API_URL}/api/messages`, {
        senderId: userId,
        recipientId: selectedConversation._id,
        content
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 3. Replace temp with actual message
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? response.data : m));
      showSuccess('Message sent!');
      
      // 4. Process with AI if AgriBot conversation
      if (selectedConversation._id === 'agribot-pro' || 
          selectedConversation.name === 'AgriBot Pro') {
        await processCropOrder(content);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setDeleting(messageId);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(prev => prev.filter(m => m._id !== messageId));
      showSuccess('Message deleted!');
    } catch (err) {
      console.error('❌ Error deleting message:', err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredMessages = messages.filter(m =>
    m.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredConversations = conversations.filter(c =>
    (c.name || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-700">
      {/* AgriBot Pro Professional Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-emerald-500 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-1">
              🌾 AgriBot Pro
            </h2>
            <p className="text-xs text-emerald-100">Smart Farming Assistant</p>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="hover:bg-red-600 hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-red-400 group relative"
          title="Close AgriBot Pro"
        >
          <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 bg-red-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Close Chat
          </div>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-32 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-700 flex-shrink-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conv => (
                <button
                  key={conv._id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setPreviousMessageCount(0);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs border-b border-gray-700 transition-colors truncate ${
                    selectedConversation?._id === conv._id
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700'
                  }`}
                  title={conv.name}
                >
                  {conv.name || 'Unknown'}
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-gray-600 text-center">No conversations</div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map(msg => (
                    <div
                      key={msg._id}
                      onMouseEnter={() => setHoveredMessageId(msg._id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="group relative">
                        <div
                          className={`px-3 py-2 rounded-lg text-sm max-w-xs break-words ${
                            msg.senderId === userId
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-700 text-gray-200'
                          } ${msg.isAI ? 'border-l-4 border-blue-500 bg-blue-900 text-blue-50' : ''}`}
                        >
                          {msg.content}
                        </div>
                        {hoveredMessageId === msg._id && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            disabled={deleting === msg._id}
                            className="absolute -right-8 top-0 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {deleting === msg._id ? '...' : '×'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    <div className="text-center">
                      <p className="text-sm">Start the conversation!</p>
                      <p className="text-xs mt-1">Ask about crops or order seeds</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessageWithAI} className="border-t border-gray-700 bg-gray-800 p-4 flex gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Ask about crops, order seeds, or get farming advice..."
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 text-sm transition"
                />
                <button 
                  type="submit" 
                  disabled={!messageText.trim() || aiLoading || isProcessingOrder}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition flex items-center gap-2"
                >
                  {aiLoading || isProcessingOrder ? (
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
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <svg className="w-20 h-20 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-center text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBoxContainer;
