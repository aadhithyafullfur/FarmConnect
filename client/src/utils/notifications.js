/**
 * Utility function to show toast notifications instead of browser alerts
 * @param {string} message - The message to display
 * @param {string} type - The type of notification: 'success', 'error', 'warning', 'info'
 */
export const showNotification = (message, type = 'info') => {
  const event = new CustomEvent('showNotification', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};

// Convenience functions
export const showSuccess = (message) => showNotification(message, 'success');
export const showError = (message) => showNotification(message, 'error');
export const showWarning = (message) => showNotification(message, 'warning');
export const showInfo = (message) => showNotification(message, 'info');