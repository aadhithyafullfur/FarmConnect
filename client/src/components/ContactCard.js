import React from 'react';
import { showSuccess } from '../utils/notifications';

const ContactCard = ({ 
  user, 
  title = "Contact Information", 
  showActions = true, 
  className = "",
  size = "normal" // normal, compact, large
}) => {
  if (!user) {
    return (
      <div className={`bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">❓</div>
          <p className="text-gray-400">Contact information not available</p>
        </div>
      </div>
    );
  }

  const avatarSizes = {
    compact: "w-8 h-8 text-sm",
    normal: "w-12 h-12 text-lg",
    large: "w-16 h-16 text-xl"
  };

  const containerSizes = {
    compact: "p-3",
    normal: "p-4",
    large: "p-6"
  };

  return (
    <div className={`bg-gray-700/30 rounded-xl border border-gray-600/30 ${containerSizes[size]} ${className}`}>
      {title && (
        <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
          <span>👤</span>
          <span>{title}</span>
        </h4>
      )}

      <div className="flex items-center space-x-3 mb-4">
        <div className={`bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center ${avatarSizes[size]}`}>
          <span className="text-white font-bold">
            {(user.name || user.username || 'U')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-white font-medium truncate">
            {user.name || user.username || 'Unknown User'}
          </h5>
          <p className="text-gray-400 text-sm capitalize truncate">
            {user.role || 'User'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {user.email && (
          <div className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
              <span className="text-blue-400 text-sm">📧</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-400 text-xs">Email</div>
              <div className="text-white text-sm truncate">{user.email}</div>
            </div>
            {showActions && (
              <a
                href={`mailto:${user.email}`}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-all duration-200"
              >
                Send
              </a>
            )}
          </div>
        )}

        {user.phone && (
          <div className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
              <span className="text-green-400 text-sm">📱</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-400 text-xs">Phone</div>
              <div className="text-white text-sm">{user.phone}</div>
            </div>
            {showActions && (
              <a
                href={`tel:${user.phone}`}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-all duration-200"
              >
                Call
              </a>
            )}
          </div>
        )}

        {user.address && (
          <div className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
              <span className="text-purple-400 text-sm">📍</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-400 text-xs">Address</div>
              <div className="text-white text-sm leading-relaxed">{user.address}</div>
            </div>
            {showActions && (
              <button
                onClick={() => showSuccess('Location shared!')}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-all duration-200"
              >
                View
              </button>
            )}
          </div>
        )}

        {user.location && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
              <span className="text-orange-400 text-sm">🌍</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-400 text-xs">Location</div>
              <div className="text-white text-sm">
                {user.location.city && user.location.state 
                  ? `${user.location.city}, ${user.location.state}`
                  : user.location.city || user.location.state || 'Location available'
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {showActions && (user.email || user.phone) && (
        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-600/30">
          {user.phone && (
            <a
              href={`tel:${user.phone}`}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-all duration-200 text-center text-sm font-medium"
            >
              📞 Call
            </a>
          )}
          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-200 text-center text-sm font-medium"
            >
              📧 Email
            </a>
          )}
          <button
            onClick={() => showSuccess('Message sent!')}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all duration-200 text-center text-sm font-medium"
          >
            💬 Message
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactCard;