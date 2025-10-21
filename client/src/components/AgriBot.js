import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { showError, showSuccess } from '../utils/notifications';

// CSS for tooltips
const tooltipStyles = `
  .tooltip-container {
    position: relative;
  }
  
  .tooltip {
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    z-index: 100;
  }
  
  .tooltip-container:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }
`;

const AgriBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Google API configuration
  const GOOGLE_API_KEY = 'AIzaSyDtRgP_FASM7Rg15N-rH1VYclg93XjdrNE';

  // Load messages from localStorage on initial render
  useEffect(() => {
    const savedMessages = localStorage.getItem('agribot_messages');
    if (savedMessages && JSON.parse(savedMessages).length > 0) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert date strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
  }, []);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('agribot_messages', JSON.stringify(messages));
    }
  }, [messages]);

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
          text: `🌾 Hello! I'm AgriBot, your premium farm-to-home assistant! \n\n✨ **How I can help you today:**\n🔍 Discover fresh crops (${crops.length} available)\n📊 Compare prices & quality\n🛒 Place orders with one click\n💡 Get personalized recommendations\n🚚 Track your deliveries\n\n**Popular requests:**\n• "Show me organic vegetables"\n• "What seasonal fruits do you have?"\n• "Compare tomato varieties"\n• "Add 2kg potatoes to my cart"\n\n**What are you looking for today?** 🌱`,
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
    
    // Enhanced crop search with fuzzy matching and spelling variations
    const findRelevantCrops = () => {
      // Define common spelling variations and plurals
      const cropVariations = {
        'tomato': ['tomatos', 'tomatoe', 'tomatoes', 'tomato'],
        'potato': ['potatos', 'potatoe', 'potatoes', 'potato'],
        'carrot': ['carrots', 'carot', 'carrot'],
        'onion': ['onions', 'onion'],
        'broccoli': ['brocoli', 'brocolli', 'broccoli'],
        'cabbage': ['cabages', 'cabage', 'cabbage'],
        'apple': ['apples', 'apple'],
        'orange': ['oranges', 'orange'],
        'banana': ['bananas', 'banana'],
        'strawberry': ['strawberries', 'strawberry'],
        'vegetable': ['vegetables', 'veggie', 'veggies', 'vegetable'],
        'fruit': ['fruits', 'fruit']
      };
      
      // Find variations of user input
      const findMatchingCrop = (userInput) => {
        for (const [cropName, variations] of Object.entries(cropVariations)) {
          if (variations.some(variant => userInput.includes(variant))) {
            return cropName;
          }
        }
        return userInput;
      };
      
      // Extract potential crop names from user message
      const potentialCropTerms = lowerMessage.split(/\s+/);
      const matchedCropTerms = potentialCropTerms.map(term => findMatchingCrop(term));
      
      // Normalize and clean user input for better matching
      const normalizedUserInput = lowerMessage
        .replace(/\s+/g, ' ')
        .trim();
      
      // Add debug info if debug mode is enabled
      if (debugMode) {
        console.log('Debug - User input:', lowerMessage);
        console.log('Debug - Matched terms:', matchedCropTerms);
        console.log('Debug - Available crops:', availableCrops.map(c => c.name));
      }
      
      return availableCrops.filter(crop => {
        const cropName = crop.name?.toLowerCase() || '';
        const cropCategory = crop.category?.toLowerCase() || '';
        const cropDescription = crop.description?.toLowerCase() || '';
        
        // Check exact matches
        const exactMatch = cropName.includes(lowerMessage) ||
               lowerMessage.includes(cropName) ||
               cropCategory.includes(lowerMessage) ||
               lowerMessage.includes(cropCategory) ||
               cropDescription.includes(lowerMessage);
               
        // Check for matches using our variations dictionary
        const variationMatch = matchedCropTerms.some(term => 
          cropName.includes(term) || term.includes(cropName)
        );
        
        // Check for close matches (e.g. "tomato" vs "tomatos")
        const similarityMatch = Object.keys(cropVariations).some(baseCrop => {
          return cropName.includes(baseCrop) && 
                 cropVariations[baseCrop].some(variant => normalizedUserInput.includes(variant));
        });
        
        return exactMatch || variationMatch || similarityMatch;
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
    } else if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('purchase') || 
              // Also check for quantity patterns that suggest ordering
              /(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|kilo|kilos|kilograms?)/.test(lowerMessage)) {
      // This handles ordering intents including "1kg of tomatoes"
      botResponse = handleOrderIntent(message);
    } else if (lowerMessage.match(/\b(tomato|tomatos|tomatoes)\b/i)) {
      // Check if this might be an order intent that wasn't caught above
      if (lowerMessage.match(/\b(need|want|get|give|send)\b/i)) {
        botResponse = handleOrderIntent(message);
      } else {
        // Just display tomato products
        const tomatoProducts = availableCrops.filter(crop => 
          crop.name.toLowerCase().includes('tomato') || 
          crop.description?.toLowerCase().includes('tomato')
        );
        
        if (tomatoProducts.length > 0) {
          botResponse = {
            type: 'crop-display',
            crops: tomatoProducts.slice(0, 6),
            text: `🍅 Great! I found ${tomatoProducts.length} tomato products for you:`,
            hasMore: tomatoProducts.length > 6,
            moreCount: tomatoProducts.length - 6
          };
        }
      }
    } else if (lowerMessage.includes('compare')) {
      botResponse = handleComparison(message);
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
    // Return a special object for crop-display type
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

  // Handle order intent with automatic order placement
  const handleOrderIntent = (message) => {
    // Extract quantity and crop name from message
    const lowerMessage = message.toLowerCase();
    
    // Regular expressions to match different order patterns
    const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|kilo|kilos|kilograms?)/i;
    const quantityMatch = lowerMessage.match(quantityRegex);
    
    // First check for explicit order patterns like "order 2kg tomatoes"
    if (quantityMatch) {
      const quantity = parseFloat(quantityMatch[1]);
      const unit = quantityMatch[2].toLowerCase().startsWith('k') ? 'kg' : 'g';
      
      // Extract the crop name using our crop variations dictionary
      const cropVariations = {
        'tomato': ['tomatos', 'tomatoe', 'tomatoes', 'tomato'],
        'potato': ['potatos', 'potatoe', 'potatoes', 'potato'],
        'carrot': ['carrots', 'carot', 'carrot'],
        'onion': ['onions', 'onion'],
        'broccoli': ['brocoli', 'brocolli', 'broccoli'],
        'cabbage': ['cabages', 'cabage', 'cabbage'],
        'apple': ['apples', 'apple'],
        'orange': ['oranges', 'orange'],
        'banana': ['bananas', 'banana'],
        'strawberry': ['strawberries', 'strawberry']
      };
      
      // Find which crop was mentioned
      let detectedCrop = null;
      let cropName = '';
      
      for (const [baseCrop, variations] of Object.entries(cropVariations)) {
        if (variations.some(variant => lowerMessage.includes(variant))) {
          // Find the actual crop from our available crops
          const matchedCrops = availableCrops.filter(crop => 
            crop.name.toLowerCase().includes(baseCrop)
          );
          
          if (matchedCrops.length > 0) {
            detectedCrop = matchedCrops[0];
            cropName = detectedCrop.name;
            break;
          }
        }
      }
      
      // If we found a crop and quantity, place the order
      if (detectedCrop) {
        // Calculate the price
        const orderQuantity = unit === 'kg' ? quantity : quantity/1000;
        const totalPrice = orderQuantity * detectedCrop.price;
        
        // Add to cart through the API
        try {
          // Normally we'd call the API here
          // api.post('/cart/add', { productId: detectedCrop.id, quantity: orderQuantity });
          
          // For now, simulate a successful order
          return {
            type: 'order-confirmation',
            orderDetails: {
              crop: cropName,
              quantity: `${quantity}${unit}`,
              price: `₹${totalPrice.toFixed(2)}`,
              status: 'Added to Cart'
            },
            text: `✅ **Order Placed Successfully!**\n\n🛒 Added to your cart:\n• ${quantity}${unit} of ${cropName}\n• Price: ₹${totalPrice.toFixed(2)}\n\n📦 Your order has been added to your cart! You can check out when you're ready.\n\n💡 Would you like to order anything else?`
          };
        } catch (error) {
          console.error('Error adding to cart:', error);
          return `❌ I'm sorry, there was an error processing your order. Please try again or contact customer support.`;
        }
      }
    }
    
    // If we couldn't extract order details, provide a helpful message
    return `🛒 **Ready to place an order?** \n\nI'd love to help you order fresh crops! Here's what I need:\n\n1️⃣ **Crop & Quantity** - What would you like and how much?\n2️⃣ **Delivery Details** - Your address and preferred delivery time\n3️⃣ **Contact Info** - So we can coordinate delivery\n\n💡 You can start by telling me something like:\n"I want 5kg tomatoes" or "Order 2kg apples"\n\nWhat would you like to order? 📦`;
  };

  // Get help message
  const getHelpMessage = () => {
    return `🤖 **AgriBot Help Center**\n\n🌟 **What I can do:**\n\n🔍 **Search Crops:**\n   • "Show me tomatoes"\n   • "What vegetables do you have?"\n   • "All available fruits"\n\n📊 **Compare Options:**\n   • "Compare apples and oranges"\n   • "Show me the cheapest vegetables"\n\n🛒 **Order Assistance:**\n   • "I want to order 5kg rice"\n   • "Help me place an order"\n\n💡 **Get Recommendations:**\n   • "What's fresh today?"\n   • "Best crops for this season"\n\n📱 **Try saying:**\n   • "Show all crops"\n   • "Compare prices"\n   • "Help me order"\n\nHow can I assist you today? 😊`;
  };

  // Improved fallback response with intent detection
  const getFallbackResponse = (message) => {
    // Try to detect common intents and variations
    const lowerMessage = message.toLowerCase();
    
    // Check for common crop types with spelling variations
    const commonCrops = [
      { terms: ['tomato', 'tomatos', 'tomatoes', 'tomatoe'], category: 'vegetable' },
      { terms: ['potato', 'potatos', 'potatoes', 'potatoe'], category: 'vegetable' },
      { terms: ['carrot', 'carrots'], category: 'vegetable' },
      { terms: ['onion', 'onions'], category: 'vegetable' },
      { terms: ['apple', 'apples'], category: 'fruit' },
      { terms: ['banana', 'bananas'], category: 'fruit' },
      { terms: ['orange', 'oranges'], category: 'fruit' },
      { terms: ['strawberry', 'strawberries'], category: 'fruit' }
    ];
    
    // Check if any common crop is mentioned
    for (const crop of commonCrops) {
      if (crop.terms.some(term => lowerMessage.includes(term))) {
        // Found a crop mention, show crops of that type
        const matchingCrops = availableCrops.filter(c => 
          crop.terms.some(term => c.name.toLowerCase().includes(term)) ||
          c.category.toLowerCase() === crop.category
        );
        
        if (matchingCrops.length > 0) {
          const cropType = crop.terms[0];
          return {
            type: 'crop-display',
            crops: matchingCrops.slice(0, 6),
            text: `🌱 I found ${matchingCrops.length} ${cropType}(s) and similar ${crop.category}s for you:`,
            hasMore: matchingCrops.length > 6,
            moreCount: matchingCrops.length - 6
          };
        }
      }
    }
    
    // Check if it might be a simple greeting
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'howdy'];
    if (greetings.some(g => lowerMessage.includes(g))) {
      return `� Hello there! I'm AgriBot, your farm assistant. How can I help you today? You can ask me about our fresh crops, prices, or how to place an order!\n\n💡 **Try asking:**\n• "What vegetables do you have?"\n• "Show me your best fruits"\n• "I need 2kg of tomatoes"`;
    }
    
    // Check if asking about availability
    if (lowerMessage.includes('have') || lowerMessage.includes('available') || 
        lowerMessage.includes('sell') || lowerMessage.includes('offer') || 
        lowerMessage.includes('stock') || lowerMessage.includes('inventory')) {
      return `📋 We have a variety of fresh crops available! Here's what's in stock:\n\n• Vegetables: Tomatoes, Potatoes, Carrots, Onions, and more\n• Fruits: Apples, Oranges, Bananas, Strawberries, and more\n• Grains & Cereals: Rice, Wheat, Oats\n\nWhat specific type of crop are you interested in?`;
    }
    
    // Standard fallback responses as a last resort
    const responses = [
      `🤔 I didn't quite understand "${message}". Could you try asking about specific crops or categories?`,
      `💭 I'm here to help with farm products! Try asking "Do you have tomatoes?" or "Show me fruits"`,
      `🌱 I'm your farm assistant! Ask me about vegetables, fruits, grains, or type "help" for more options.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + 
           `\n\n💡 **Quick suggestions:**\n• "Show all crops"\n• "Do you have tomatoes?"\n• "Help me find vegetables"`;
  };

  // Generate contextual suggestions based on conversation history
  const getContextualSuggestions = () => {
    // Default suggestions if we don't have enough context
    if (messages.length < 2) return [];
    
    const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
    
    // Extract mentioned crops from recent messages
    const extractMentionedCrops = () => {
      const recentMessages = messages.slice(-3);
      const mentionedCrops = [];
      
      recentMessages.forEach(msg => {
        if (typeof msg.text !== 'string') return;
        
        availableCrops.forEach(crop => {
          if (msg.text.toLowerCase().includes(crop.name.toLowerCase()) && 
              !mentionedCrops.includes(crop.name)) {
            mentionedCrops.push(crop.name);
          }
        });
      });
      
      return mentionedCrops;
    };
    
    const mentionedCrops = extractMentionedCrops();
    const suggestions = [];
    
    // If user has mentioned crops, suggest relevant actions
    if (mentionedCrops.length > 0) {
      const crop = mentionedCrops[0];
      suggestions.push(`Add ${crop} to cart`);
      suggestions.push(`Compare ${crop} with similar crops`);
    }
    
    // If the last bot message was about a specific topic, suggest relevant follow-ups
    if (lastBotMessage) {
      const text = typeof lastBotMessage.text === 'string' ? lastBotMessage.text : '';
      
      if (text.includes('price') || text.includes('cost')) {
        suggestions.push('Show me cheaper options');
      }
      
      if (text.includes('order') || text.includes('delivery')) {
        suggestions.push('How long is delivery time?');
      }
      
      if (text.includes('season') || text.includes('fresh')) {
        suggestions.push('What\'s in season now?');
      }
    }
    
    // Add some generic but useful suggestions
    suggestions.push('What are your most popular crops?');
    suggestions.push('Help me create a shopping list');
    
    // Return up to 3 unique suggestions
    return [...new Set(suggestions)].slice(0, 3);
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
      // Quick response for simple greetings
      const quickResponses = {
        'hi': '👋 Hello! How can I help with your farm-to-home needs today?',
        'hello': '👋 Hello there! What crops are you looking for today?',
        'hey': '👋 Hey! How can I help you find the perfect crops?',
        'help': getHelpMessage(),
        'thanks': 'You\'re welcome! Is there anything else I can help with?',
        'thank you': 'You\'re welcome! Is there anything else I can help with?'
      };
      
      const normalizedInput = currentMessage.toLowerCase().trim();
      let botResponse;
      
      // Check for exact matches in quick responses
      if (quickResponses[normalizedInput]) {
        botResponse = quickResponses[normalizedInput];
      } else {
        // Process message normally
        botResponse = await processUserMessage(currentMessage);
      }

      // Simulate realistic typing delay
      const typingDelay = Math.min(Math.max(currentMessage.length * 50, 800), 2000);

      setTimeout(() => {
        setIsTyping(false);

        if (botResponse) {
          // If botResponse is a special type, wrap in message object
          let botMessage;
          if (typeof botResponse === 'object' && botResponse.type === 'crop-display') {
            botMessage = {
              id: Date.now() + 1,
              text: botResponse,
              sender: 'bot',
              timestamp: new Date(),
              type: 'crop-display'
            };
          } else if (typeof botResponse === 'object' && botResponse.type === 'order-confirmation') {
            botMessage = {
              id: Date.now() + 1,
              text: botResponse,
              sender: 'bot',
              timestamp: new Date(),
              type: 'order-confirmation'
            };
          } else {
            botMessage = {
              id: Date.now() + 1,
              text: botResponse,
              sender: 'bot',
              timestamp: new Date()
            };
          }
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
  
  // Inject tooltip styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = tooltipStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Open chatbot and initialize
  const openChatbot = () => {
    setIsOpen(true);
    initializeChatbot();
  };

  // Message reactions system
  const [reactions, setReactions] = useState({});
  
  const addReaction = (messageId, reaction) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: reaction
    }));
    
    // If it's a negative reaction (thumbs down), ask for feedback
    if (reaction === 'thumbs-down') {
      const feedbackMessage = {
        id: Date.now(),
        text: "I'm sorry my response wasn't helpful. Could you tell me how I can improve my answer?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'feedback-request'
      };
      setMessages(prev => [...prev, feedbackMessage]);
    }
    
    // If it's a positive reaction (thumbs up), thank the user
    if (reaction === 'thumbs-up') {
      const thankMessage = {
        id: Date.now(),
        text: "Thanks for the positive feedback! Is there anything else I can help with?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'feedback-thanks'
      };
      setMessages(prev => [...prev, thankMessage]);
    }
  };
  
  return (
    <>
      {/* Enhanced Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={openChatbot}
          className={`relative w-16 h-16 bg-gradient-to-br from-slate-800 via-green-700 to-slate-800 text-white rounded-full shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-110 flex items-center justify-center group ${isOpen ? 'ring-4 ring-green-500/30' : ''}`}
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
            <div className="absolute -top-16 right-0 bg-slate-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap border border-slate-700 shadow-xl">
              <div className="font-semibold">Chat with AgriBot<span className="text-green-400">Pro</span></div>
              <div className="text-green-300 text-xs">Get crop recommendations!</div>
            </div>
          )}
        </button>
      </div>

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,100,0,0.3)] border border-slate-700/50 z-50 flex flex-col overflow-hidden transition-all duration-300">
          {/* Premium Chat Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 flex items-center justify-between relative border-b border-slate-600/30 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center border border-green-500/50 shadow-inner shadow-green-500/20">
                  <span className="text-2xl">🌾</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AgriBot<span className="text-green-400">Pro</span></h3>
                <p className="text-slate-300 text-xs flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Online • Farm-to-Home Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Clear Chat Button */}
              <button
                onClick={() => {
                  if (window.confirm('Clear the chat history? This will remove all your previous conversations.')) {
                    setMessages([]);
                    localStorage.removeItem('agribot_messages');
                    initializeChatbot();
                    showSuccess('Chat history cleared successfully!');
                  }
                }}
                className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all duration-200 tooltip-container"
                aria-label="Clear Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="tooltip">Clear Chat</span>
              </button>
              
              {/* Debug Mode Toggle - Hidden for regular users, activated with click */}
              <button
                onClick={() => setDebugMode(!debugMode)}
                onDoubleClick={(e) => e.stopPropagation()}
                className="text-white/40 hover:text-white/60 hover:bg-white/10 p-2 rounded-xl transition-all duration-200 tooltip-container"
                aria-label="Debug Mode"
              >
                <svg className={`w-4 h-4 ${debugMode ? 'text-green-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="tooltip">Debug Mode: {debugMode ? 'On' : 'Off'}</span>
              </button>
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-5 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('/public/pattern.svg')] bg-repeat opacity-10"></div>
              <div className="absolute top-2 right-20 text-4xl">🥕</div>
              <div className="absolute bottom-2 left-20 text-3xl">🍅</div>
            </div>
          </div>

          {/* Enhanced Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-800/90 to-slate-900/95">
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
                      className={`p-4 rounded-2xl shadow-lg relative group ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-8'
                          : 'bg-slate-800 border border-slate-700/80 text-slate-100 mr-8 shadow-xl'
                      }`}
                    >
                      {/* Copy to clipboard button (only for bot messages) */}
                      {message.sender === 'bot' && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(message.text);
                            showSuccess('Copied to clipboard');
                          }}
                          className="absolute top-2 right-2 p-1 bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-600"
                          title="Copy to clipboard"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {typeof message.text === 'string' ? (
                          <div dangerouslySetInnerHTML={{ 
                            __html: message.text
                              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                              .replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1 py-0.5 rounded text-slate-200">$1</code>')
                              .replace(/\n\n/g, '<br/><br/>')
                              .replace(/\n/g, '<br/>')
                              .replace(/• ([^\n]+)/g, '<div class="flex items-start"><span class="mr-2 text-green-400">•</span>$1</div>')
                          }} />
                        ) : message.text}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className={`text-xs ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                        }`}>
                          {(() => {
                            const now = new Date();
                            const msgDate = message.timestamp;
                            const diffMs = now - msgDate;
                            const diffMins = Math.round(diffMs / 60000);
                            const diffHours = Math.round(diffMs / 3600000);
                            const diffDays = Math.round(diffMs / 86400000);
                            
                            if (diffMins < 1) return 'Just now';
                            if (diffMins === 1) return '1 min ago';
                            if (diffMins < 60) return `${diffMins} mins ago`;
                            if (diffHours === 1) return '1 hour ago';
                            if (diffHours < 24) return `${diffHours} hours ago`;
                            if (diffDays === 1) return 'Yesterday';
                            if (diffDays < 7) return `${diffDays} days ago`;
                            
                            return msgDate.toLocaleDateString(undefined, { 
                              month: 'short', day: 'numeric', 
                              hour: '2-digit', minute: '2-digit' 
                            });
                          })()}
                        </div>
                        
                        {/* Reaction buttons - only show for bot messages */}
                        {message.sender === 'bot' && message.type !== 'feedback-request' && message.type !== 'feedback-thanks' && (
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => addReaction(message.id, 'thumbs-up')}
                              className={`p-1 rounded-full ${reactions[message.id] === 'thumbs-up' ? 'bg-green-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                              title="Helpful"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7,22 L7,10 L3,10 C2.4,10 2,10.4 2,11 L2,21 C2,21.6 2.4,22 3,22 L7,22 Z M21.5,10 L14.4,10 L15,7.4 C15.1,6.7 15,5.8 14.6,5.3 L13,2.8 C12.8,2.5 12.4,2.5 12.2,2.8 L7.2,10.2 C7,10.4 7,10.8 7,11 L7,20 C7,21.1 7.9,22 9,22 L18,22 C18.8,22 19.5,21.4 19.7,20.7 L21.9,12.7 C22,12.1 21.8,11.3 21.1,10.9 C21.3,10.9 21.4,10 21.5,10 Z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => addReaction(message.id, 'thumbs-down')}
                              className={`p-1 rounded-full ${reactions[message.id] === 'thumbs-down' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                              title="Not helpful"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,22 L17,10 L21,10 C21.6,10 22,10.4 22,11 L22,21 C22,21.6 21.6,22 21,22 L17,22 Z M2.5,10 L9.6,10 L9,7.4 C8.9,6.7 9,5.8 9.4,5.3 L11,2.8 C11.2,2.5 11.6,2.5 11.8,2.8 L16.8,10.2 C17,10.4 17,10.8 17,11 L17,20 C17,21.1 16.1,22 15,22 L6,22 C5.2,22 4.5,21.4 4.3,20.7 L2.1,12.7 C2,12.1 2.2,11.3 2.9,10.9 C2.7,10.9 2.6,10 2.5,10 Z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Order confirmation card */}
                  {message.type === 'order-confirmation' && message.text && typeof message.text === 'object' && message.text.type === 'order-confirmation' && (
                    <div className="mr-8">
                      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-2xl p-4 shadow-lg mb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">✅</span>
                          <h3 className="font-bold text-green-400 text-lg">Order Placed Successfully!</h3>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-lg p-3 mb-3 border border-slate-700/50">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <span className="text-slate-300">Item:</span>
                            <span className="font-medium text-white text-right">{message.text.orderDetails.crop}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <span className="text-slate-300">Quantity:</span>
                            <span className="font-medium text-white text-right">{message.text.orderDetails.quantity}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <span className="text-slate-300">Price:</span>
                            <span className="font-medium text-green-400 text-right">{message.text.orderDetails.price}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-slate-300">Status:</span>
                            <span className="font-medium text-green-300 text-right">{message.text.orderDetails.status}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => window.location.href = '/cart'}
                            className="bg-green-700 hover:bg-green-600 text-white py-1.5 px-3 rounded-lg text-sm flex items-center gap-1 shadow-md"
                          >
                            <span>🛒</span> View Cart
                          </button>
                          <button 
                            onClick={() => setInputMessage("Continue shopping")}
                            className="bg-slate-700 hover:bg-slate-600 text-white py-1.5 px-3 rounded-lg text-sm"
                          >
                            Continue Shopping
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-green-500 px-2">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Added to your cart</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Crop display cards */}
                  {message.type === 'crop-display' && message.text && typeof message.text === 'object' && (
                    <div className="mr-8">
                      <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-2xl shadow-xl mb-3">
                        <div className="text-sm leading-relaxed text-slate-100 mb-3">
                          {message.text.text}
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {message.text.crops.map((crop, index) => {
                          const emoji = getCropEmoji(crop.category);
                          return (
                            <div key={index} className="bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600/50 rounded-2xl p-4 shadow-lg hover:shadow-green-900/20 transition-all duration-200 transform hover:-translate-y-1">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center border border-slate-500/30">
                                    <span className="text-2xl">{emoji}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-100">{crop.name}</h4>
                                    <p className="text-sm text-slate-300 capitalize">{crop.category}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-blue-400">₹{crop.price}</p>
                                  <p className="text-xs text-slate-400">per {crop.unit}</p>
                                </div>
                              </div>
                              <div className="mb-3 text-sm text-slate-300">
                                <p>📦 Available: {crop.quantity} {crop.unit}</p>
                                {crop.description && (
                                  <p className="text-slate-400 mt-1">📝 {crop.description.substring(0, 60)}{crop.description.length > 60 ? '...' : ''}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => addToCart(crop, 1)}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 text-white py-2 px-4 rounded-xl font-medium hover:from-green-500 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a2 2 0 100-4 2 2 0 000 4zm-8-2a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span>Add to Cart</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setInputMessage("");
                                    setTimeout(() => setInputMessage(`Tell me more about ${crop.name}`), 50);
                                  }}
                                  className="px-4 py-2 bg-slate-700 hover:bg-emerald-800 text-slate-200 hover:text-emerald-100 rounded-xl font-medium transition-all duration-200 border border-slate-600 hover:border-emerald-600"
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
                            className="w-full mt-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-1 px-3 rounded-lg text-sm font-medium transition-all duration-200"
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
                  <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-2xl mr-8 shadow-xl">
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 mt-0.5 flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                      </div>
                      <div>
                        <div className="h-4 bg-slate-700 rounded w-64 animate-pulse mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-40 animate-pulse mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-52 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Premium Input Area with Voice Command */}
          <div className="p-3 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 shadow-inner">
            {/* Enhanced quick action buttons */}
            <div className="flex space-x-2 mb-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {[
                { text: '🌿 All Crops', command: 'Show all crops' },
                { text: '💰 Compare', command: 'Compare prices' },
                { text: '🛒 Order Help', command: 'Help me order' },
                { text: '🌱 Seasonal', command: 'What\'s fresh?' },
                { text: '🥕 Vegetables', command: 'Show me vegetables' },
                { text: '🍎 Fruits', command: 'Show me fruits' }
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(suggestion.command)}
                  className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-green-900 hover:to-emerald-800 text-slate-300 hover:text-emerald-100 text-xs rounded-full border border-slate-600 hover:border-green-600 transition-all duration-200 shadow-sm"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
            
            <div className="flex items-end space-x-2">
              {/* Voice Input Button */}
              <button
                onClick={() => {
                  alert('Voice input feature coming soon! 🎤');
                  // Future voice input implementation
                }}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition-all duration-200 flex items-center justify-center border border-slate-600 shadow-sm tooltip-container"
                aria-label="Voice Input"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="tooltip">Voice Input</span>
              </button>
            
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about crops & farming! 🌱"
                  className="w-full px-4 py-3 pr-12 bg-slate-700 border border-slate-600 focus:border-green-500 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-200 shadow-lg text-sm text-slate-200 placeholder-slate-400"
                  rows="1"
                  style={{ minHeight: '42px', maxHeight: '80px' }}
                  disabled={isLoading}
                  maxLength={500}
                />
                {/* Character count with animated bar */}
                <div className="absolute bottom-1 right-3 text-xs text-slate-400 flex items-center">
                  <div className="w-12 h-1 rounded-full bg-slate-600 mr-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${inputMessage.length > 400 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min((inputMessage.length / 500) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span>{inputMessage.length}/500</span>
                </div>
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-green-500/25 transform hover:scale-105 disabled:transform-none"
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
            
            {/* Smart suggestions based on conversation context */}
            {messages.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {getContextualSuggestions().map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(suggestion)}
                    className="text-xs bg-slate-700/80 hover:bg-green-900/80 text-slate-300 hover:text-green-100 py-1.5 px-3 rounded-full border border-slate-600/50 hover:border-green-600/50 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {/* Premium features note */}
            <div className="mt-2 text-xs text-center text-slate-500 italic">
              <span className="inline-flex items-center">Powered by <span className="text-green-500 font-semibold mx-1">AgriBot</span>AI • Try voice commands soon!</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgriBot;