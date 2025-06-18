#!/usr/bin/env node
/**
 * PDF Compressor - Simple Deployment Script
 * 
 * This script creates a local server to test the built PDF Compressor application.
 * It serves the static files from the 'build' directory created by 'npm run build'.
 * 
 * Usage:
 *   node deploy.js [options]
 * 
 * Options:
 *   --port, -p     Port to run the server on (default: 8080)
 *   --host, -h     Host to bind the server to (default: localhost)
 *   --open, -o     Automatically open in default browser (default: true)
 *   --help         Show help
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const chalk = require('chalk'); // For colorful console output

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  port: 8080,
  host: 'localhost',
  open: true
};

// Process command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--port' || arg === '-p') {
    options.port = parseInt(args[++i], 10) || options.port;
  } else if (arg === '--host' || arg === '-h') {
    options.host = args[++i] || options.host;
  } else if (arg === '--open' || arg === '-o') {
    options.open = args[++i] !== 'false';
  } else if (arg === '--help') {
    console.log(`
${chalk.bold('PDF Compressor - Deployment Script')}

${chalk.yellow('Usage:')}
  node deploy.js [options]

${chalk.yellow('Options:')}
  --port, -p     Port to run the server on (default: 8080)
  --host, -h     Host to bind the server to (default: localhost)
  --open, -o     Automatically open in default browser (default: true)
  --help         Show this help message
    `);
    process.exit(0);
  }
}

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.error(chalk.red('Error: Build directory not found!'));
  console.log(chalk.yellow('Please run "npm run build" before deploying.'));
  process.exit(1);
}

// Create Express app
const app = express();

// Serve static files from the build directory
app.use(express.static(buildPath));

// Handle all routes by serving index.html (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Start the server
app.listen(options.port, options.host, () => {
  const url = `http://${options.host === '0.0.0.0' ? 'localhost' : options.host}:${options.port}`;
  
  console.log(chalk.green('✓ PDF Compressor deployed successfully!'));
  console.log(chalk.cyan(`Server running at: ${url}`));
  
  // Open in browser if specified
  if (options.open) {
    const openCommand = process.platform === 'win32' ? 'start' : 
                       (process.platform === 'darwin' ? 'open' : 'xdg-open');
    try {
      execSync(`${openCommand} ${url}`);
      console.log(chalk.green('✓ Opened in browser'));
    } catch (error) {
      console.log(chalk.yellow('! Could not open in browser automatically'));
    }
  }
  
  console.log(chalk.gray('\nPress Ctrl+C to stop the server'));
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nShutting down server...'));
  process.exit(0);
});
