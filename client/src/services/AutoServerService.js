// Auto-Server Startup Service
class AutoServerService {
  constructor() {
    this.serverUrl = 'http://localhost:5001';
    this.healthEndpoint = `${this.serverUrl}/health`;
    this.isMonitoring = false;
    this.retryCount = 0;
    this.maxRetries = 15;
    this.retryInterval = 2000;
  }

  // Start monitoring and auto-recovery
  startAutoRecovery() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 Auto-recovery service started');
    
    this.monitorHealth();
  }

  // Stop monitoring
  stopAutoRecovery() {
    this.isMonitoring = false;
    console.log('⏹️ Auto-recovery service stopped');
  }

  // Monitor server health continuously
  async monitorHealth() {
    while (this.isMonitoring) {
      const isHealthy = await this.checkHealth();
      
      if (!isHealthy && this.retryCount < this.maxRetries) {
        console.log(`🔄 Attempting server recovery... (${this.retryCount + 1}/${this.maxRetries})`);
        await this.attemptServerStartup();
        this.retryCount++;
      } else if (isHealthy) {
        this.retryCount = 0;
        console.log('✅ Server is healthy');
      } else {
        console.log('❌ Max recovery attempts reached');
        this.showManualStartupInstructions();
        break;
      }
      
      await this.sleep(this.retryInterval);
    }
  }

  // Check if server is responding
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(this.healthEndpoint, {
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Attempt to start server automatically
  async attemptServerStartup() {
    // Try to trigger server startup via various methods
    try {
      // Method 1: Try to wake up server with a request
      await this.pingServer();
      
      // Method 2: Show user notification for manual start
      this.showStartupNotification();
      
    } catch (error) {
      console.log('Server startup attempt failed:', error.message);
    }
  }

  // Ping server to potentially wake it up
  async pingServer() {
    try {
      await fetch(`${this.serverUrl}/wake-up`, {
        method: 'GET',
        mode: 'no-cors'
      });
    } catch (error) {
      // Expected to fail if server is down
    }
  }

  // Show startup notification to user
  showStartupNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'server-startup-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #fff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span>🔄 Attempting to start server... Please wait or click to start manually</span>
          <button onclick="window.autoServerService.startManually()" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
          ">
            Start Manually
          </button>
        </div>
      </div>
      <style>
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    
    // Remove existing notification
    const existing = document.getElementById('server-startup-notification');
    if (existing) existing.remove();
    
    // Add new notification
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.getElementById('server-startup-notification')) {
        notification.remove();
      }
    }, 10000);
  }

  // Show manual startup instructions
  showManualStartupInstructions() {
    alert(`🚨 Server Auto-Recovery Failed

Please start the server manually using one of these methods:

🚀 EASIEST: Double-click "🚀-QUICK-START.bat"
💻 CMD: Run "npm start" in project folder
🖥️ Manual: Go to server folder and run "node server.js"
🔧 VS Code: Ctrl+Shift+P → "Tasks: Run Task" → "Start FarmConnect Server"

The page will automatically connect once the server is running!`);
  }

  // Manual startup trigger
  startManually() {
    const instructions = `
🚀 Quick Start Options:

1. Double-click "🚀-QUICK-START.bat" in the project folder
2. Open terminal and run "npm start"
3. Go to server folder and run "node server.js"
4. Use VS Code task: Ctrl+Shift+P → "Tasks: Run Task"

The page will automatically detect when server is running!
    `.trim();
    
    alert(instructions);
  }

  // Utility sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get recovery status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

// Auto-start the service when page loads
if (typeof window !== 'undefined') {
  window.autoServerService = new AutoServerService();
  
  // Start auto-recovery when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.autoServerService.startAutoRecovery();
    });
  } else {
    window.autoServerService.startAutoRecovery();
  }
}

export default AutoServerService;