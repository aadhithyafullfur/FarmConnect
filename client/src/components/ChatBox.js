import React, { useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

let socket;

function ChatBox({ recipientId, recipientName }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io('http://localhost:5000');
    }

    // Load previous messages
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/messages/${recipientId}`);
        setMessages(response.data);
      } catch (err) {
        setError('Failed to load messages');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Listen for new messages
    socket.on('receiveMessage', (data) => {
      if (data.senderId === recipientId || data.recipientId === recipientId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const messageData = {
        senderId: user._id,
        recipientId,
        content: message.trim(),
        timestamp: new Date()
      };

      // Send to backend
      await axios.post('http://localhost:5000/api/messages', messageData);

      // Emit through socket
      socket.emit('sendMessage', messageData);

      // Update local state
      setMessages((prev) => [...prev, messageData]);
      setMessage('');
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-green-600 text-white">
        <h3 className="font-semibold">{recipientName || 'Chat'}</h3>
      </div>
      
      <div className="h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div 
              key={msg._id || index} 
              className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.senderId === user._id 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="break-words">{msg.content || msg.message}</p>
                <span className="text-xs opacity-75 mt-1 block">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 border-t flex gap-2">
          <textarea
            className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Type a message..."
            rows="2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`px-4 rounded-lg ${
              message.trim() 
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;