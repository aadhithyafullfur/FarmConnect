import React from 'react';

const LoadingSpinner = ({ 
  size = "normal", // small, normal, large
  variant = "spinner", // spinner, dots, pulse, bars
  message = "",
  fullScreen = false,
  color = "green" // green, blue, purple, gray
}) => {
  const getSizeClasses = (size) => {
    const sizes = {
      small: "w-6 h-6",
      normal: "w-12 h-12",
      large: "w-16 h-16"
    };
    return sizes[size] || sizes.normal;
  };

  const getColorClasses = (color) => {
    const colors = {
      green: "border-green-500",
      blue: "border-blue-500", 
      purple: "border-purple-500",
      gray: "border-gray-500"
    };
    return colors[color] || colors.green;
  };

  const renderSpinner = () => {
    const sizeClass = getSizeClasses(size);
    const colorClass = getColorClasses(color);
    
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 bg-${color}-500 rounded-full animate-bounce`}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClass} bg-${color}-500 rounded-full animate-pulse`} />
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 h-8 bg-${color}-500 animate-pulse`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        );
      
      default: // spinner
        return (
          <div 
            className={`${sizeClass} border-4 ${colorClass} border-t-transparent rounded-full animate-spin`}
          />
        );
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderSpinner()}
      {message && (
        <div className={`text-${color}-400 text-center`}>
          <div className="font-medium">{message}</div>
          <div className="text-sm text-gray-500 mt-1">Please wait...</div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
};

export default LoadingSpinner;