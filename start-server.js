#!/usr/bin/env node

/**
 * INSTANT SERVER STARTUP SCRIPT
 * Run this file directly: node start-server.js
 * This will start the server on port 5002
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = __dirname;
const serverPath = path.join(projectRoot, 'server');

console.log('\n' + '='.repeat(60));
console.log('🚀 FARMCONNECT SERVER STARTUP');
console.log('='.repeat(60));
console.log(`\n📁 Project Root: ${projectRoot}`);
console.log(`📂 Server Directory: ${serverPath}\n`);

// Check if node_modules exists
if (!fs.existsSync(path.join(serverPath, 'node_modules'))) {
  console.log('⚠️  node_modules not found in server directory');
  console.log('📦 Installing dependencies...\n');
  
  const install = spawn('npm', ['install'], {
    cwd: serverPath,
    stdio: 'inherit',
    shell: true
  });

  install.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ npm install failed');
      process.exit(1);
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 STARTING SERVER...');
  console.log('='.repeat(60) + '\n');

  const server = spawn('node', ['server.js'], {
    cwd: serverPath,
    stdio: 'inherit',
    shell: true
  });

  server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

  server.on('close', (code) => {
    console.error(`\n⚠️  Server process exited with code ${code}`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server gracefully...');
    server.kill('SIGINT');
    process.exit(0);
  });
}
