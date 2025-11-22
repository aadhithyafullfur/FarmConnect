import React, { useState } from 'react';
import ChatBoxContainer from './ChatBoxContainer';

const WhatsAppButton = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {/* Chat Window - Fixed at bottom-right */}
      {showChat && (
        <ChatBoxContainer onClose={() => setShowChat(false)} />
      )}

      {/* Floating Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title="Open Chat"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            <path d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      )}
    </>
  );
};

export default WhatsAppButton;
