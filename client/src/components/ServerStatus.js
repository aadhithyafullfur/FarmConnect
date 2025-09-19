import React, { useState, useEffect } from 'react';
import ServerHealthService from '../services/ServerHealthService';

const ServerStatus = () => {
  const [serverStatus, setServerStatus] = useState({
    isHealthy: false,
    isChecking: true,
    retryAttempts: 0,
    maxRetries: 10,
    message: 'Checking server connection...',
  });

  useEffect(() => {
    let mounted = true;
    let intervalId = null;
    const healthService = new ServerHealthService();

    const checkServer = async () => {
      if (!mounted) return;

      setServerStatus(prev => ({
        ...prev,
        isChecking: true,
        message: 'Connecting to server...',
      }));

      const isHealthy = await healthService.checkServerHealth();
      
      if (!mounted) return;

      if (isHealthy) {
        setServerStatus({
          isHealthy: true,
          isChecking: false,
          retryAttempts: 0,
          maxRetries: 10,
          message: 'Server connected successfully!',
        });
      } else {
        // Server is not available, start retry process
        await healthService.waitForServer(
          (attempts, max) => {
            if (!mounted) return;
            setServerStatus(prev => ({
              ...prev,
              isChecking: true,
              retryAttempts: attempts,
              maxRetries: max,
              message: `Attempting to connect to server... (${attempts}/${max})`,
            }));
          },
          () => {
            if (!mounted) return;
            setServerStatus({
              isHealthy: true,
              isChecking: false,
              retryAttempts: 0,
              maxRetries: 10,
              message: 'Server connected successfully!',
            });
          },
          () => {
            if (!mounted) return;
            setServerStatus(prev => ({
              ...prev,
              isHealthy: false,
              isChecking: false,
              message: 'Unable to connect to server. Please start the server manually.',
            }));
          }
        );
      }
    };

    // Initial check
    checkServer();

    // Set up continuous monitoring every 3 seconds
    intervalId = setInterval(() => {
      if (mounted) {
        checkServer();
      }
    }, 3000);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const handleRetry = () => {
    setServerStatus(prev => ({
      ...prev,
      isChecking: true,
      retryAttempts: 0,
      message: 'Retrying connection...',
    }));
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleStartServer = () => {
    alert(`To start the server:
1. Open a new terminal (Ctrl + Shift + \`)
2. Run: cd server
3. Run: npm start
4. Or use VS Code task: Ctrl + Shift + P > "Tasks: Run Task" > "Start FarmConnect Server"`);
  };

  if (serverStatus.isHealthy && !serverStatus.isChecking) {
    return null; // Don't show anything when server is healthy
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {serverStatus.isChecking ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <div className="h-5 w-5 rounded-full bg-red-600"></div>
            )}
            <span className="font-medium">{serverStatus.message}</span>
          </div>
          
          <div className="flex space-x-3">
            {!serverStatus.isChecking && !serverStatus.isHealthy && (
              <>
                <button
                  onClick={handleRetry}
                  className="px-4 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={handleStartServer}
                  className="px-4 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors"
                >
                  How to Start Server
                </button>
              </>
            )}
          </div>
        </div>
        
        {serverStatus.isChecking && serverStatus.retryAttempts > 0 && (
          <div className="mt-2">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(serverStatus.retryAttempts / serverStatus.maxRetries) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerStatus;