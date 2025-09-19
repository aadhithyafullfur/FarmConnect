import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { showError, showSuccess } from '../utils/notifications';

const AgriBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Google API configuration
  const GOOGLE_API_KEY = 'AIzaSyDtRgP_FASM7Rg15N-rH1VYclg93XjdrNE';

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch available crops from API with better error handling
  const fetchAvailableCrops = async () => {
    try {
      const response = await api.get('/products');
      const crops = response.data || [];
      setAvailableCrops(crops);
      console.log('Fetched crops:', crops.length);
      return crops;
    } catch (error) {
      console.error('Error fetching crops:', error);
      showError('Unable to connect to crop database');
      return [];
    }
  };

  // Initialize chatbot when opened
  const initializeChatbot = async () => {
    if (messages.length === 0) {
      setIsLoading(true);
      try {
        const crops = await fetchAvailableCrops();
        const greetingMessage = {
          id: Date.now(),
          text: `🌾 Hello! I'm AgriBot, your farm-to-home assistant! \n\n✨ I can help you with:\n🔍 Discover fresh crops (${crops.length} available)\n📊 Compare prices & quality\n🛒 Place orders\n💡 Get recommendations\n\nWhat type of crop are you looking for today? Try asking:\n• "Show me vegetables"\n• "What fruits do you have?"\n• "Compare tomato prices"`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'greeting'
        };
        setMessages([greetingMessage]);
      } catch (error) {
        console.error('Error initializing:', error);
        const errorMessage = {
          id: Date.now(),
          text: "🤖 Hi! I'm AgriBot. I'm ready to help you discover fresh crops! What are you looking for?",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Enhanced AI response with Google Gemini (with fallback)
  const getAIResponse = async (userMessage, cropContext) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are AgriBot, a helpful farm-to-home assistant for FarmConnect. 

User message: "${userMessage}"

Available crops: ${cropContext}

Guidelines:
- Be friendly, helpful, and use appropriate emojis
- Provide specific crop details when asked
- Help with comparisons, recommendations, and ordering
- Keep responses concise but informative
- Always end by asking how else you can help
- If user asks about specific crops, format the response nicely with bullet points

Respond as AgriBot:`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('AI API error');
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
      console.error('AI API Error:', error);
      return null;
    }
  };

  // Enhanced message processing with better crop search
  const processUserMessage = async (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced crop search
    const findRelevantCrops = () => {
      return availableCrops.filter(crop => {
        const cropName = crop.name?.toLowerCase() || '';
        const cropCategory = crop.category?.toLowerCase() || '';
        const cropDescription = crop.description?.toLowerCase() || '';
        
        return cropName.includes(lowerMessage) ||
               lowerMessage.includes(cropName) ||
               cropCategory.includes(lowerMessage) ||
               lowerMessage.includes(cropCategory) ||
               cropDescription.includes(lowerMessage);
      });
    };

    const relevantCrops = findRelevantCrops();
    
    // Category-based search
    const categorySearch = () => {
      const categories = {
        'vegetable': ['vegetable', 'veggies', 'veggie'],
        'fruit': ['fruit', 'fruits'],
        'grain': ['grain', 'grains', 'cereal'],
        'herbs': ['herb', 'herbs', 'spice', 'spices'],
        'dairy': ['dairy', 'milk', 'cheese'],
        'nuts': ['nut', 'nuts', 'almond', 'cashew']
      };

      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
          return availableCrops.filter(crop => crop.category === category);
        }
      }
      return [];
    };

    let botResponse = '';

    // Handle specific intents
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      botResponse = getHelpMessage();
    } else if (lowerMessage.includes('all') || lowerMessage.includes('everything') || lowerMessage.includes('available')) {
      botResponse = showAllCrops();
    } else if (lowerMessage.includes('compare')) {
      botResponse = handleComparison(message);
    } else if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      botResponse = handleOrderIntent(message);
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('expensive') || lowerMessage.includes('cheap')) {
      botResponse = handlePriceInquiry(relevantCrops);
    } else if (relevantCrops.length > 0) {
      botResponse = formatCropDetails(relevantCrops);
    } else {
      const categoryResults = categorySearch();
      if (categoryResults.length > 0) {
        botResponse = formatCropDetails(categoryResults);
      } else {
        // Use AI for complex queries
        const cropContext = availableCrops.slice(0, 10).map(crop => 
          `${crop.name}: ₹${crop.price}/${crop.unit}, ${crop.quantity} available, Category: ${crop.category}`
        ).join('; ');
        
        const aiResponse = await getAIResponse(message, cropContext);
        
        if (aiResponse) {
          botResponse = aiResponse;
        } else {
          botResponse = getFallbackResponse(message);
        }
      }
    }

    return botResponse;
  };

  // Enhanced crop details formatting with interactive buttons
  const formatCropDetails = (crops) => {
    if (crops.length === 0) {
      return "🤔 I couldn't find any crops matching your request. Try asking about vegetables, fruits, grains, or herbs! Type 'help' to see what I can do.";
    }

    // Create a special message with crop cards
    return {
      type: 'crop-display',
      crops: crops.slice(0, 6),
      text: `🌱 Great! I found ${crops.length} crop${crops.length > 1 ? 's' : ''} for you:`,
      hasMore: crops.length > 6,
      moreCount: crops.length - 6
    };
  };

  // Get appropriate emoji for crop category
  const getCropEmoji = (category) => {
    const emojis = {
      'vegetable': '🥬',
      'fruit': '🍎',
      'grain': '🌾',
      'dairy': '🥛',
      'herbs': '🌿',
      'spices': '🌶️',
      'nuts': '🥜',
      'meat': '🥩'
    };
    return emojis[category] || '🌱';
  };

  // Show all available crops by category
  const showAllCrops = () => {
    if (availableCrops.length === 0) {
      return "📦 I'm still loading our crop inventory. Please try again in a moment!";
    }

    const categories = {};
    availableCrops.forEach(crop => {
      if (!categories[crop.category]) {
        categories[crop.category] = [];
      }
      categories[crop.category].push(crop);
    });

    let response = `📋 **Our Complete Crop Inventory (${availableCrops.length} items):**\n\n`;

    Object.entries(categories).forEach(([category, crops]) => {
      const emoji = getCropEmoji(category);
      response += `${emoji} **${category.toUpperCase()} (${crops.length})**\n`;
      crops.slice(0, 5).forEach(crop => {
        response += `   • ${crop.name} - ₹${crop.price}/${crop.unit}\n`;
      });
      if (crops.length > 5) {
        response += `   ... and ${crops.length - 5} more\n`;
      }
      response += '\n';
    });

    response += "💡 Ask me about any specific category or crop for detailed information!";
    return response;
  };

  // Handle comparison requests
  const handleComparison = (message) => {
    if (availableCrops.length < 2) {
      return "📊 I need at least 2 crops to compare. Let me show you what's available first!";
    }

    // Try to extract specific crops from message
    const words = message.toLowerCase().split(/\s+/);
    const mentionedCrops = availableCrops.filter(crop => 
      words.some(word => crop.name.toLowerCase().includes(word) || word.includes(crop.name.toLowerCase()))
    );

    const cropsToCompare = mentionedCrops.length >= 2 ? mentionedCrops.slice(0, 4) : availableCrops.slice(0, 4);
    
    let response = "📊 **Crop Comparison:**\n\n";
    
    cropsToCompare.forEach((crop, index) => {
      response += `${index + 1}. **${crop.name}**\n`;
      response += `   💰 ₹${crop.price}/${crop.unit}\n`;
      response += `   📦 ${crop.quantity} ${crop.unit} available\n`;
      response += `   🏷️ ${crop.category}\n\n`;
    });

    response += "💡 Which one interests you most? I can provide more details about any specific crop!";
    return response;
  };

  // Handle price inquiries
  const handlePriceInquiry = (crops) => {
    if (crops.length === 0) {
      const cheapest = availableCrops.sort((a, b) => a.price - b.price).slice(0, 5);
      let response = "💰 **Most Affordable Crops:**\n\n";
      cheapest.forEach((crop, index) => {
        response += `${index + 1}. ${crop.name} - ₹${crop.price}/${crop.unit}\n`;
      });
      return response;
    }

    let response = "💰 **Price Information:**\n\n";
    crops.forEach(crop => {
      response += `• ${crop.name}: ₹${crop.price}/${crop.unit}\n`;
    });
    
    return response + "\n💡 Would you like to compare with other similar crops?";
  };

  // Handle order intent
  const handleOrderIntent = (message) => {
    return `🛒 **Ready to place an order?** \n\nI'd love to help you order fresh crops! Here's what I need:\n\n1️⃣ **Crop & Quantity** - What would you like and how much?\n2️⃣ **Delivery Details** - Your address and preferred delivery time\n3️⃣ **Contact Info** - So we can coordinate delivery\n\n💡 You can start by telling me something like:\n"I want 5kg tomatoes" or "Order 2kg apples"\n\nWhat would you like to order? 📦`;
  };

  // Get help message
  const getHelpMessage = () => {
    return `🤖 **AgriBot Help Center**\n\n🌟 **What I can do:**\n\n🔍 **Search Crops:**\n   • "Show me tomatoes"\n   • "What vegetables do you have?"\n   • "All available fruits"\n\n📊 **Compare Options:**\n   • "Compare apples and oranges"\n   • "Show me the cheapest vegetables"\n\n🛒 **Order Assistance:**\n   • "I want to order 5kg rice"\n   • "Help me place an order"\n\n💡 **Get Recommendations:**\n   • "What's fresh today?"\n   • "Best crops for this season"\n\n📱 **Try saying:**\n   • "Show all crops"\n   • "Compare prices"\n   • "Help me order"\n\nHow can I assist you today? 😊`;
  };

  // Fallback response for unrecognized queries
  const getFallbackResponse = (message) => {
    const responses = [
      `🤔 I didn't quite understand "${message}". Could you try asking about specific crops or categories?`,
      `💭 Let me help you differently! Try asking "What vegetables do you have?" or "Show me fruits"`,
      `🌱 I'm here to help with crops! Ask me about vegetables, fruits, grains, or type "help" for more options.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + 
           `\n\n💡 **Quick suggestions:**\n• "Show all crops"\n• "What's available today?"\n• "Help me find vegetables"`;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '52px';
    }

    try {
      const botResponse = await processUserMessage(currentMessage);
      
      // Simulate realistic typing delay
      const typingDelay = Math.min(Math.max(currentMessage.length * 50, 800), 2000);
      
      setTimeout(() => {
        setIsTyping(false);
        
        if (botResponse) {
          const botMessage = {
            id: Date.now() + 1,
            text: botResponse,
            sender: 'bot',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botMessage]);
        }
        
        setIsLoading(false);
      }, typingDelay);
    } catch (error) {
      console.error('Error processing message:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "😅 Oops! I encountered an error processing your request. Please try again or ask me something else!",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Add to cart functionality
  const addToCart = async (crop, quantity = 1) => {
    try {
      const response = await api.post('/cart/add', {
        productId: crop._id,
        quantity: quantity
      });
      
      if (response.data) {
        showSuccess(`${crop.name} added to cart successfully! 🛒`);
        
        // Add success message to chat
        const successMessage = {
          id: Date.now(),
          text: `✅ **${crop.name}** has been added to your cart!\n\n🛒 **Cart Action:**\n• Quantity: ${quantity} ${crop.unit}\n• Price: ₹${(crop.price * quantity).toFixed(2)}\n\nWould you like to:\n• Add more items\n• View your cart\n• Continue shopping`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'success'
        };
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Failed to add item to cart. Please try again.');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        text: `❌ Sorry, I couldn't add **${crop.name}** to your cart right now. Please try again or contact support if the issue persists.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  // Open chatbot and initialize
  const openChatbot = () => {
    setIsOpen(true);
    initializeChatbot();
  };

  return (
    <>
      {/* Enhanced Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={openChatbot}
          className={`relative w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 text-white rounded-full shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-110 flex items-center justify-center group ${isOpen ? 'ring-4 ring-green-400/30' : ''}`}
        >
          {isOpen ? (
            <svg className="w-6 h-6 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative">
              <span className="text-2xl animate-bounce">🌾</span>
              {/* Notification dot */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">!</span>
              </div>
            </div>
          )}
          
          {/* Enhanced tooltip */}
          {!isOpen && (
            <div className="absolute -top-16 right-0 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap border border-gray-700 shadow-xl">
              <div className="font-semibold">Chat with AgriBot</div>
              <div className="text-green-300 text-xs">Get crop recommendations!</div>
            </div>
          )}
        </button>
      </div>

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 z-50 flex flex-col overflow-hidden">
          {/* Enhanced Chat Header */}
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 p-5 flex items-center justify-between relative">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <span className="text-2xl">🌾</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-300 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AgriBot</h3>
                <p className="text-green-100 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
                  Online • Farm-to-Home Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-20 text-4xl">🥕</div>
              <div className="absolute bottom-2 left-20 text-3xl">🍅</div>
            </div>
          </div>

          {/* Enhanced Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/80 to-white/90">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.sender === 'bot' && (
                    <div className="flex items-center space-x-2 mb-1 ml-1">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-xs">🌾</span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">AgriBot</span>
                    </div>
                  )}
                  {/* Regular text message */}
                  {typeof message.text === 'string' && (
                    <div
                      className={`p-4 rounded-2xl shadow-lg ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ml-8'
                          : 'bg-white border border-gray-200/80 text-gray-800 mr-8 shadow-xl'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.text}
                      </div>
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                  
                  {/* Crop display cards */}
                  {typeof message.text === 'object' && message.text.type === 'crop-display' && (
                    <div className="mr-8">
                      <div className="bg-white border border-gray-200/80 p-4 rounded-2xl shadow-xl mb-3">
                        <div className="text-sm leading-relaxed text-gray-800 mb-3">
                          {message.text.text}
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        {message.text.crops.map((crop, index) => {
                          const emoji = getCropEmoji(crop.category);
                          return (
                            <div key={index} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200/80 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">{emoji}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800">{crop.name}</h4>
                                    <p className="text-sm text-gray-600 capitalize">{crop.category}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">₹{crop.price}</p>
                                  <p className="text-xs text-gray-500">per {crop.unit}</p>
                                </div>
                              </div>
                              
                              <div className="mb-3 text-sm text-gray-700">
                                <p>📦 Available: {crop.quantity} {crop.unit}</p>
                                {crop.description && (
                                  <p className="text-gray-600 mt-1">📝 {crop.description.substring(0, 60)}{crop.description.length > 60 ? '...' : ''}</p>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => addToCart(crop, 1)}
                                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-xl font-medium hover:from-green-400 hover:to-emerald-400 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a2 2 0 100-4 2 2 0 000 4zm-8-2a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span>Add to Cart</span>
                                </button>
                                <button
                                  onClick={() => setInputMessage(`Tell me more about ${crop.name}`)}
                                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                                >
                                  Info
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {message.text.hasMore && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mt-3">
                          <p className="text-blue-800 text-sm font-medium text-center">
                            ... and {message.text.moreCount} more crops available!
                          </p>
                          <button
                            onClick={() => setInputMessage('Show me all crops')}
                            className="w-full mt-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-3 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            View All
                          </button>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-3">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Enhanced Loading indicator */}
            {(isLoading || isTyping) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] order-1">
                  <div className="flex items-center space-x-2 mb-2 ml-1">
                    <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      <span className="text-sm">🌾</span>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">AgriBot is thinking...</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 p-4 rounded-2xl mr-8 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Processing your request...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200/50">
            {/* Quick action buttons */}
            <div className="flex space-x-2 mb-3 overflow-x-auto pb-2">
              {['Show all crops', 'Compare prices', 'Help me order', 'What\'s fresh?'].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(suggestion)}
                  className="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700 text-xs rounded-full border border-gray-200 hover:border-green-300 transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything! Try: 'Add 2kg tomatoes to cart' or 'Show me vegetables'"
                  className="w-full px-4 py-3 pr-16 bg-white border-2 border-gray-200 focus:border-green-400 rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-200 shadow-lg text-sm placeholder-gray-400"
                  rows="1"
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                  disabled={isLoading}
                  maxLength={500}
                />
                {/* Character count */}
                <div className="absolute bottom-1 right-3 text-xs text-gray-400">
                  {inputMessage.length}/500
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-green-500/25 transform hover:scale-105 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgriBot;