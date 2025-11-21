#!/usr/bin/env node

/**
 * FARMCONNECT - COMPLETE STARTUP SCRIPT
 * 
 * This script starts both the server and client automatically.
 * Usage: node startup.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const serverDir = path.join(projectRoot, 'server');
const clientDir = path.join(projectRoot, 'client');

let serverProcess = null;
let clientProcess = null;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
    reset: '\x1b[0m'
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}[${new Date().toLocaleTimeString()}]${colors.reset} ${message}`);
}

function startServer() {
  log('Starting FarmConnect Server...', 'info');
  log('Port: 5002', 'info');
  log('API Endpoint: http://localhost:5002/api/messages', 'info');
  log('', 'info');

  serverProcess = spawn('node', ['server.js'], {
    cwd: serverDir,
    stdio: 'pipe',
    shell: true
  });

  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      // Color code based on content
      if (output.includes('✅') || output.includes('running')) {
        log(`[SERVER] ${output}`, 'success');
      } else if (output.includes('⚠️') || output.includes('warning')) {
        log(`[SERVER] ${output}`, 'warn');
      } else if (output.includes('❌') || output.includes('error')) {
        log(`[SERVER] ${output}`, 'error');
      } else {
        log(`[SERVER] ${output}`, 'info');
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('Listening to')) {
      log(`[SERVER ERROR] ${output}`, 'error');
    }
  });

  serverProcess.on('error', (err) => {
    log(`Failed to start server: ${err.message}`, 'error');
    process.exit(1);
  });

  serverProcess.on('close', (code) => {
    if (code !== 0) {
      log(`Server exited with code ${code}`, 'error');
    }
  });
}

function startClient() {
  // Wait 3 seconds for server to start
  setTimeout(() => {
    log('Starting FarmConnect Client...', 'info');
    log('Port: 3000', 'info');
    log('URL: http://localhost:3000', 'info');
    log('', 'info');

    clientProcess = spawn('npm', ['start'], {
      cwd: clientDir,
      stdio: 'pipe',
      shell: true
    });

    // Handle client output
    clientProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        if (output.includes('Compiled') || output.includes('running on')) {
          log(`[CLIENT] ${output}`, 'success');
        } else if (output.includes('error') || output.includes('Error')) {
          log(`[CLIENT] ${output}`, 'error');
        } else if (output.includes('warning')) {
          log(`[CLIENT] ${output}`, 'warn');
        } else {
          log(`[CLIENT] ${output}`, 'info');
        }
      }
    });

    clientProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(`[CLIENT] ${output}`, 'error');
      }
    });

    clientProcess.on('error', (err) => {
      log(`Failed to start client: ${err.message}`, 'error');
    });
  }, 3000);
}

function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'success');
  log('║         🚀 FARMCONNECT - AUTOMATIC STARTUP 🚀              ║', 'success');
  log('╚════════════════════════════════════════════════════════════╝', 'success');
  log('', 'info');

  // Check if directories exist
  if (!fs.existsSync(serverDir)) {
    log(`Server directory not found: ${serverDir}`, 'error');
    process.exit(1);
  }

  if (!fs.existsSync(clientDir)) {
    log(`Client directory not found: ${clientDir}`, 'error');
    process.exit(1);
  }

  log(`Project Root: ${projectRoot}`, 'info');
  log(`Server Dir: ${serverDir}`, 'info');
  log(`Client Dir: ${clientDir}`, 'info');
  log('', 'info');

  // Start server first
  startServer();

  // Start client after delay
  startClient();

  // Print final instructions
  setTimeout(() => {
    log('', 'info');
    log('╔════════════════════════════════════════════════════════════╗', 'success');
    log('║              ✅ SERVICES STARTING UP ✅                    ║', 'success');
    log('╚════════════════════════════════════════════════════════════╝', 'success');
    log('', 'info');
    log('Server running at: http://localhost:5002', 'success');
    log('Client running at: http://localhost:3000', 'success');
    log('Chat API: http://localhost:5002/api/messages', 'success');
    log('', 'info');
    log('📋 Next Steps:', 'info');
    log('1. Open browser to http://localhost:3000', 'info');
    log('2. Log in with your account', 'info');
    log('3. Select a farmer to chat with', 'info');
    log('4. Send a test message', 'info');
    log('', 'info');
    log('🛑 To stop: Press Ctrl+C', 'warn');
    log('', 'info');
  }, 5000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('', 'info');
    log('Shutting down FarmConnect...', 'warn');
    
    if (serverProcess) {
      log('Stopping server...', 'warn');
      serverProcess.kill('SIGINT');
    }
    
    if (clientProcess) {
      log('Stopping client...', 'warn');
      clientProcess.kill('SIGINT');
    }

    setTimeout(() => {
      log('Goodbye! 👋', 'success');
      process.exit(0);
    }, 1000);
  });
}

main();
