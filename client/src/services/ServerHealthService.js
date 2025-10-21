// Server Health Check Service
class ServerHealthService {
  constructor() {
    this.healthCheckUrl = 'http://localhost:5003/health';
    this.isServerHealthy = false;
    this.retryAttempts = 0;
    this.maxRetries = 10;
    this.retryInterval = 3000; // 3 seconds
    this.healthCheckInterval = null;
  }

  // Check if server is running
  async checkServerHealth() {
    try {
      const response = await fetch(this.healthCheckUrl, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        this.isServerHealthy = true;
        this.retryAttempts = 0;
        console.log('✅ Server is healthy and running');
        return true;
      }
    } catch (error) {
      this.isServerHealthy = false;
      console.log('❌ Server health check failed:', error.message);
    }
    
    return false;
  }

  // Start periodic health checks
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      if (!this.isServerHealthy) {
        await this.checkServerHealth();
      }
    }, this.retryInterval);
  }

  // Stop health monitoring
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Wait for server to become available
  async waitForServer(onRetry, onSuccess, onFail) {
    console.log('🔍 Checking if server is available...');
    
    while (this.retryAttempts < this.maxRetries) {
      const isHealthy = await this.checkServerHealth();
      
      if (isHealthy) {
        console.log('🎉 Server is now available!');
        if (onSuccess) onSuccess();
        return true;
      }
      
      this.retryAttempts++;
      
      if (onRetry) {
        onRetry(this.retryAttempts, this.maxRetries);
      }
      
      console.log(`⏳ Retrying in ${this.retryInterval / 1000} seconds... (${this.retryAttempts}/${this.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, this.retryInterval));
    }
    
    console.log('❌ Server is not available after maximum retries');
    if (onFail) onFail();
    return false;
  }

  // Get server status
  getServerStatus() {
    return {
      isHealthy: this.isServerHealthy,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries,
    };
  }
}

export default ServerHealthService;