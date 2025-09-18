import React from 'react';

const StatusBadge = ({ 
  status, 
  size = "normal", // compact, normal, large
  variant = "default", // default, pill, outlined
  animated = false 
}) => {
  const getStatusConfig = (status) => {
    const normalizedStatus = status?.toLowerCase();
    
    const configs = {
      pending: {
        colors: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: "⏳",
        label: "Pending"
      },
      confirmed: {
        colors: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: "✅",
        label: "Confirmed"
      },
      preparing: {
        colors: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        icon: "👨‍🍳",
        label: "Preparing"
      },
      out_for_delivery: {
        colors: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        icon: "🚚",
        label: "Out for Delivery"
      },
      delivered: {
        colors: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: "📦",
        label: "Delivered"
      },
      cancelled: {
        colors: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: "❌",
        label: "Cancelled"
      },
      active: {
        colors: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: "✅",
        label: "Active"
      },
      inactive: {
        colors: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: "⚫",
        label: "Inactive"
      },
      available: {
        colors: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: "✅",
        label: "Available"
      },
      unavailable: {
        colors: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: "❌",
        label: "Unavailable"
      },
      online: {
        colors: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: "🟢",
        label: "Online"
      },
      offline: {
        colors: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: "⚫",
        label: "Offline"
      },
      processing: {
        colors: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: "⚙️",
        label: "Processing"
      },
      completed: {
        colors: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: "✅",
        label: "Completed"
      },
      failed: {
        colors: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: "⚠️",
        label: "Failed"
      }
    };
    
    return configs[normalizedStatus] || {
      colors: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      icon: "❓",
      label: status || "Unknown"
    };
  };

  const getSizeClasses = (size) => {
    const sizes = {
      compact: "px-2 py-1 text-xs",
      normal: "px-3 py-1.5 text-sm",
      large: "px-4 py-2 text-base"
    };
    return sizes[size] || sizes.normal;
  };

  const getVariantClasses = (variant) => {
    const variants = {
      default: "border",
      pill: "border rounded-full",
      outlined: "border-2 bg-transparent"
    };
    return variants[variant] || variants.default;
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);
  const variantClasses = getVariantClasses(variant);
  const animationClasses = animated ? "animate-pulse" : "";

  return (
    <span 
      className={`
        inline-flex items-center space-x-1 font-semibold rounded-lg 
        ${config.colors} 
        ${sizeClasses} 
        ${variantClasses} 
        ${animationClasses}
        transition-all duration-200
      `}
      title={config.label}
    >
      <span className="flex-shrink-0">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;