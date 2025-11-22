# Farmer Dashboard - Code Reference & Usage Guide

## Quick Reference

### Order Status Transitions
```javascript
// Valid Status Flow
pending → confirmed → preparing → out_for_delivery → delivered
       ↓ (cancellable)
       cancelled
```

### Order Object Structure
```javascript
{
  _id: ObjectId,
  orderId: "ORDER-001",
  farmerId: ObjectId,
  customerId: ObjectId,
  customerName: String,
  status: "pending|confirmed|preparing|out_for_delivery|delivered|cancelled",
  items: [
    {
      productId: ObjectId,
      productName: String,
      quantity: Number,
      unit: String, // "kg", "piece", etc.
      pricePerUnit: Number,
      totalPrice: Number
    }
  ],
  deliveryInfo: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    instructions: String,
    phone: String,
    deliveryDate: Date
  },
  paymentInfo: {
    method: "cash|online|credit", // payment_method
    status: "pending|completed|failed"
  },
  totalAmount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Component Usage Examples

### 1. Updating Order Status
```javascript
// Handler function
const handleOrderStatusChange = (orderId, newStatus) => {
  updateOrderStatus(orderId, newStatus);
};

// Usage in button
<button onClick={() => handleOrderStatusChange(order._id, 'confirmed')}>
  Confirm Order
</button>

// This calls:
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    setUpdatingOrderId(orderId); // Show loading
    
    const response = await api.patch(`/orders/${orderId}/status`, { 
      status: newStatus 
    });
    
    // Update local state
    setOrders(orders.map(order => 
      order._id === orderId 
        ? { ...order, status: newStatus, ...response.data } 
        : order
    ));
    
    // Notify user
    showSuccess(`Order updated to ${newStatus}`);
  } catch (error) {
    showError(error.response?.data?.message);
  } finally {
    setUpdatingOrderId(null); // Hide loading
  }
};
```

### 2. Displaying Order Status Badge
```javascript
// Status badge with color coding
<span className={`px-4 py-2 rounded-full font-semibold ${getStatusBadgeClass(order.status)}`}>
  {order.status.replace(/_/g, ' ').toUpperCase()}
</span>

// Helper function
const getStatusBadgeClass = (status) => {
  const classes = {
    'pending': 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
    'confirmed': 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
    'preparing': 'bg-orange-600/20 text-orange-400 border border-orange-500/30',
    'out_for_delivery': 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
    'delivered': 'bg-green-600/20 text-green-400 border border-green-500/30',
    'cancelled': 'bg-red-600/20 text-red-400 border border-red-500/30',
  };
  return classes[status] || 'bg-gray-600/20 text-gray-400';
};
```

### 3. Rendering Conditional Action Buttons
```javascript
{/* Pending Order Actions */}
{order.status === 'pending' && (
  <>
    <button onClick={() => handleOrderStatusChange(order._id, 'confirmed')}>
      ✅ Confirm Order
    </button>
    <button onClick={() => handleOrderStatusChange(order._id, 'preparing')}>
      👨‍🍳 Start Preparing
    </button>
    <button onClick={() => handleOrderStatusChange(order._id, 'cancelled')}>
      ❌ Cancel Order
    </button>
  </>
)}

{/* Confirmed Order Actions */}
{order.status === 'confirmed' && (
  <>
    <button onClick={() => handleOrderStatusChange(order._id, 'preparing')}>
      👨‍🍳 Start Preparing
    </button>
    <button onClick={() => handleOrderStatusChange(order._id, 'out_for_delivery')}>
      🚚 Ready for Delivery
    </button>
  </>
)}

{/* Preparing Order Actions */}
{order.status === 'preparing' && (
  <>
    <button onClick={() => handleOrderStatusChange(order._id, 'out_for_delivery')}>
      🚚 Ready for Delivery
    </button>
    <button onClick={() => handleOrderStatusChange(order._id, 'delivered')}>
      ✅ Mark as Delivered
    </button>
  </>
)}

{/* Out for Delivery Actions */}
{order.status === 'out_for_delivery' && (
  <button onClick={() => handleOrderStatusChange(order._id, 'delivered')}>
    ✅ Mark as Delivered
  </button>
)}

{/* Completed/Cancelled */}
{(order.status === 'delivered' || order.status === 'cancelled') && (
  <div className="text-center py-6 bg-gray-800/40 rounded-lg">
    <span>✓ Order {order.status}</span>
  </div>
)}
```

### 4. Rendering Order Items
```javascript
{order.items && order.items.length > 0 && (
  <div className="mb-6">
    <h4 className="text-white font-semibold mb-4">
      📦 Order Items ({order.items.length})
    </h4>
    <div className="space-y-3">
      {order.items.map((item, index) => (
        <div key={index} className="flex justify-between items-center bg-gray-800/40 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">🌱</span>
            </div>
            <div>
              <p className="text-white font-medium">{item.productName}</p>
              <p className="text-gray-400 text-sm">
                Qty: {item.quantity} {item.unit || 'kg'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold text-lg">
              ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
            </p>
            <p className="text-gray-400 text-xs">
              ₹{item.pricePerUnit}/{item.unit || 'kg'}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### 5. Displaying Delivery Information
```javascript
{order.deliveryInfo && (
  <div className="mb-6">
    <h4 className="text-white font-semibold mb-4">
      🚚 Delivery Information
    </h4>
    
    {/* Address */}
    <div className="bg-gray-800/40 rounded-xl p-4 mb-4 border border-gray-600/30">
      <div className="flex items-start space-x-3">
        <span className="text-blue-400 text-lg">📍</span>
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-1">Address</p>
          <p className="text-gray-200">
            {order.deliveryInfo.address?.street || order.deliveryAddress}
          </p>
        </div>
      </div>
    </div>

    {/* Special Instructions */}
    {order.deliveryInfo.instructions && (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-400 text-lg">📝</span>
          <div>
            <p className="text-yellow-400 font-medium text-sm mb-1">
              Special Instructions
            </p>
            <p className="text-yellow-200 text-sm">
              {order.deliveryInfo.instructions}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
)}
```

### 6. Displaying Payment Summary
```javascript
<div className="bg-gradient-to-r from-gray-700/40 to-gray-600/30 rounded-2xl p-6 border border-gray-600/30">
  <h4 className="text-white font-semibold mb-4">
    💳 Payment Summary
  </h4>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Payment Method */}
    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30">
      <div className="flex items-center space-x-3">
        <span className="text-purple-400 text-2xl">💳</span>
        <div>
          <p className="text-gray-400 text-sm">Payment Method</p>
          <p className="text-white font-semibold capitalize">
            {order.paymentMethod?.replace(/_/g, ' ') || 'Cash on Delivery'}
          </p>
        </div>
      </div>
    </div>

    {/* Total Amount */}
    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
      <div className="flex items-center space-x-3">
        <span className="text-green-400 text-2xl">💰</span>
        <div>
          <p className="text-green-400 text-sm font-medium">Total Amount</p>
          <p className="text-3xl font-bold text-green-300">
            ₹{order.totalAmount?.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## State Management Examples

### 1. Fetching Orders
```javascript
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    
    const ordersRes = await api.get("/orders/farmer");
    setOrders(ordersRes.data || []);
    
    // Recalculate analytics with new data
    calculateAnalytics(products, ordersRes.data || []);
  } catch (err) {
    console.error("Error fetching orders:", err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
}, []);

// Call on component mount
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 2. Calculating Analytics
```javascript
const calculateAnalytics = (products, orders) => {
  setAnalytics({
    totalProducts: products.length,
    
    availableProducts: products.filter(
      (p) => p.status === "available"
    ).length,
    
    totalRevenue: orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    
    pendingOrders: orders.filter(
      (o) => o.status === "pending"
    ).length,
    
    completedOrders: orders.filter(
      (o) => o.status === "delivered"
    ).length,
  });
};
```

### 3. Updating Order in State
```javascript
// After successful API call
setOrders(orders.map(order => 
  order._id === orderId 
    ? { 
        ...order, 
        status: newStatus,
        updatedAt: new Date(),
        // Merge any additional response data
        ...response.data 
      } 
    : order
));

// Recalculate analytics
const updatedOrders = orders.map(order => 
  order._id === orderId ? { ...order, status: newStatus } : order
);
calculateAnalytics(products, updatedOrders);
```

---

## API Integration Examples

### 1. Patch Request for Status Update
```javascript
// Request
const response = await api.patch(`/orders/${orderId}/status`, { 
  status: 'confirmed' 
});

// Expected Response
{
  _id: "order123",
  status: "confirmed",
  updatedAt: "2024-01-15T10:30:00Z",
  updatedBy: "farmer_id"
}

// Error Response
{
  status: 400,
  message: "Invalid status transition",
  currentStatus: "pending",
  requestedStatus: "delivered"
}
```

### 2. Error Handling Pattern
```javascript
try {
  const response = await api.patch(...);
  // Handle success
} catch (error) {
  // API Error with message
  if (error.response?.data?.message) {
    const errorMsg = error.response.data.message;
    showError(`❌ ${errorMsg}`);
  }
  // Network error
  else if (error.message === 'Network Error') {
    showError("❌ Network connection failed");
  }
  // Unknown error
  else {
    showError("❌ Failed to update order status");
  }
}
```

---

## Styling Patterns

### 1. Button States
```javascript
// Normal State
<button className="
  px-4 py-3 
  bg-gradient-to-r from-blue-600 to-blue-700 
  hover:from-blue-500 hover:to-blue-600 
  text-white rounded-lg 
  transition-all duration-200 
  shadow-lg hover:shadow-blue-500/20
">
  Action
</button>

// Loading State (disabled)
<button disabled className="
  px-4 py-3 
  bg-gradient-to-r from-blue-600/50 to-blue-700/50 
  disabled:cursor-not-allowed 
  text-white rounded-lg 
  opacity-50
">
  Loading...
</button>
```

### 2. Color-Coded Cards
```javascript
// Gradient Background
className="bg-gradient-to-br from-gray-700/30 to-gray-600/20"

// Border Styling
className="border border-gray-600/30"

// Hover Effect
className="hover:border-gray-500/50 transition-all"

// Backdrop Blur (optional for modern effect)
className="backdrop-blur-md"
```

### 3. Text Hierarchy
```javascript
// Title
<h3 className="text-2xl lg:text-3xl font-bold text-green-400">
  Title
</h3>

// Subtitle
<p className="text-gray-400 text-sm">
  Subtitle
</p>

// Important Value
<p className="text-3xl font-bold text-green-300">
  ₹1000
</p>

// Secondary Info
<p className="text-gray-400 text-xs">
  Secondary
</p>
```

---

## Performance Tips

### 1. Memoization
```javascript
// Prevent unnecessary function recreation
const handleStatusChange = useCallback((orderId, newStatus) => {
  updateOrderStatus(orderId, newStatus);
}, []); // Empty deps - function doesn't depend on props/state

// In JSX
onClick={() => handleStatusChange(order._id, 'confirmed')}
```

### 2. Conditional Rendering
```javascript
// Only render if data exists
{order.items && order.items.length > 0 && (
  <OrderItemsList items={order.items} />
)}

// Avoid expensive operations
{loading ? <Skeleton /> : <OrderCard />}
```

### 3. Batch State Updates
```javascript
// React batches these into single re-render
setOrders([...]);
calculateAnalytics(...);
showSuccess(...);

// All trigger one render
```

---

## Common Patterns

### 1. Loading State Management
```javascript
const [updatingOrderId, setUpdatingOrderId] = useState(null);

// In button
disabled={updatingOrderId === order._id}

// In event handler
try {
  setUpdatingOrderId(orderId);
  // API call
} finally {
  setUpdatingOrderId(null);
}

// In render
{updatingOrderId === order._id ? <LoadingState /> : <NormalState />}
```

### 2. Error Handling
```javascript
try {
  // API call
} catch (error) {
  // Extract error message
  const msg = error.response?.data?.message || error.message;
  
  // Show to user
  showError(msg);
  
  // Log for debugging
  console.error('Order update failed:', error);
} finally {
  // Always cleanup
  setUpdatingOrderId(null);
}
```

### 3. Data Transformation
```javascript
// Format status for display
const displayStatus = order.status
  .replace(/_/g, ' ')
  .replace(/\b\w/g, l => l.toUpperCase());
// 'out_for_delivery' → 'Out For Delivery'

// Format currency
const formatted = order.totalAmount.toFixed(2);
// 1000 → '1000.00'
```

---

## Testing Checklist

- [ ] Order loads correctly
- [ ] Status buttons appear based on current status
- [ ] Loading state shows during API call
- [ ] Button disabled while loading
- [ ] Order updates after status change
- [ ] Success message shows
- [ ] Error message shows on failure
- [ ] Analytics recalculates
- [ ] Delivery info displays
- [ ] Payment summary shows
- [ ] Mobile responsive
- [ ] No console errors

---

## Debugging Tips

### 1. Check Component State
```javascript
console.log('Current orders:', orders);
console.log('Updating order ID:', updatingOrderId);
console.log('Analytics:', analytics);
```

### 2. Verify API Response
```javascript
const response = await api.patch(...);
console.log('API Response:', response.data);
console.log('Response status:', response.status);
```

### 3. Monitor State Changes
```javascript
useEffect(() => {
  console.log('Orders updated:', orders);
}, [orders]);

useEffect(() => {
  console.log('Loading state:', updatingOrderId);
}, [updatingOrderId]);
```

---

## Quick Links

- **Component File:** `client/src/pages/farmer/FarmerDashboard.js`
- **API Service:** `client/src/services/api.js`
- **Notifications:** `client/src/utils/notifications.js`
- **Tailwind Config:** `client/tailwind.config.js`

---

**Last Updated:** 2024
**Version:** 1.0
