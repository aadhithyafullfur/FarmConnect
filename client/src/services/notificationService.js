import io from 'socket.io-client';
import api from './api';

class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  // Initialize socket connection
  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5003', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification service');
      this.isConnected = true;
      this.socket.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
      this.isConnected = false;
    });

    this.socket.on('newNotification', (notification) => {
      console.log('New notification received:', notification);
      this.handleNewNotification(notification);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Handle new notification
  handleNewNotification(notification) {
    // Trigger all registered listeners
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);

    // Play notification sound
    this.playNotificationSound(notification.priority);
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        actions: [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      };

      const browserNotification = new Notification(notification.title, options);

      browserNotification.onclick = () => {
        window.focus();
        this.handleNotificationClick(notification);
        browserNotification.close();
      };

      // Auto close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }

  // Play notification sound
  playNotificationSound(priority = 'medium') {
    try {
      const audio = new Audio();
      
      switch (priority) {
        case 'urgent':
          audio.src = '/sounds/urgent.mp3';
          break;
        case 'high':
          audio.src = '/sounds/high.mp3';
          break;
        default:
          audio.src = '/sounds/default.mp3';
          break;
      }
      
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
      });
    } catch (error) {
      console.log('Notification sound not available:', error);
    }
  }

  // Handle notification click
  handleNotificationClick(notification) {
    if (notification.data?.orderId) {
      // Navigate to order details
      window.location.href = `/orders/${notification.data.orderId}`;
    } else if (notification.data?.productId) {
      // Navigate to product details
      window.location.href = `/products/${notification.data.productId}`;
    }
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Add notification listener
  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  // Remove notification listener
  removeListener(id) {
    this.listeners.delete(id);
  }

  // API methods for notifications
  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId) {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      // Emit socket event for real-time update
      if (this.socket) {
        this.socket.emit('notificationRead', notificationId);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead() {
    try {
      await api.patch('/notifications/mark-all-read');
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async deleteNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}`);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async clearReadNotifications() {
    try {
      await api.delete('/notifications/clear-read');
      return true;
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      return false;
    }
  }

  // Get connection status
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
