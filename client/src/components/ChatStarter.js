import React, { useState } from 'react';
import ChatBox from './ChatBox';

const ChatStarter = ({ userId, userName, buttonText = "Chat", className = "" }) => {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return (
      <ChatBox
        receiverId={userId}
        receiverName={userName}
        onClose={() => setShowChat(false)}
      />
    );
  }

  return (
    <button
      onClick={() => setShowChat(true)}
      className={`group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium ${className}`}
    >
      {/* Icon */}
      <div className="relative">
        <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping group-hover:animate-none"></div>
      </div>
      
      {/* Button Text */}
      <span className="text-sm">
        {typeof buttonText === 'string' ? buttonText : buttonText}
      </span>
      
      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </button>
  );
};

export default ChatStarter;