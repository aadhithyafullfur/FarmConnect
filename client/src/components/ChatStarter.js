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
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {buttonText}
    </button>
  );
};

export default ChatStarter;