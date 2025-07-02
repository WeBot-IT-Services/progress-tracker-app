#!/usr/bin/env node

/**
 * Immediate Database Setup Script
 * This script provides instructions and opens the browser for manual setup
 */

import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🚀 Mysteel Progress Tracker - Database Setup');
console.log('===========================================');
console.log('');

// Check if the development server is running
function checkServer() {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Development server not running at http://localhost:5173');
    console.log('');
    console.log('Please start the development server first:');
    console.log('  npm run dev');
    console.log('');
    console.log('Then run this script again.');
    process.exit(1);
  }
  
  console.log('✅ Development server is running!');
  console.log('');
  
  // Create a simple HTML file that will execute the setup
  const setupHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Setup - Mysteel Progress Tracker</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .step {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            margin: 15px 0;
            border-radius: 10px;
            border-left: 4px solid #4CAF50;
        }
        .command {
            background: #1a1a1a;
            color: #00ff00;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            font-size: 16px;
            cursor: pointer;
            border: 2px solid #333;
            transition: all 0.3s ease;
        }
        .command:hover {
            border-color: #4CAF50;
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
        }
        .credentials {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .credential-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .btn {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 5px;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #45a049;
            transform: translateY(-2px);
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: bold;
        }
        .success { background: rgba(76, 175, 80, 0.2); border: 1px solid #4CAF50; }
        .error { background: rgba(244, 67, 54, 0.2); border: 1px solid #f44336; }
        .warning { background: rgba(255, 193, 7, 0.2); border: 1px solid #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Database Setup - Mysteel Progress Tracker</h1>
        
        <div class="step">
            <h3>Step 1: Open Application Console</h3>
            <p>Click the button below to open the main application, then press <strong>F12</strong> to open developer tools.</p>
            <button class="btn" onclick="openApp()">Open Application</button>
        </div>
        
        <div class="step">
            <h3>Step 2: Execute Setup Command</h3>
            <p>In the console tab, copy and paste this command:</p>
            <div class="command" onclick="copyToClipboard('setupCompleteDatabase()')">
                setupCompleteDatabase()
            </div>
            <p><small>Click the command above to copy it to clipboard</small></p>
        </div>
        
        <div class="step">
            <h3>Step 3: Verify Setup</h3>
            <p>After setup completes, run this verification command:</p>
            <div class="command" onclick="copyToClipboard('verifyDatabase()')">
                verifyDatabase()
            </div>
        </div>
        
        <div class="credentials">
            <h3>🔑 Test Account Credentials</h3>
            <div class="credential-row">
                <span><strong>Admin:</strong></span>
                <span>admin@mysteel.com / admin123</span>
            </div>
            <div class="credential-row">
                <span><strong>Sales:</strong></span>
                <span>sales@mysteel.com / sales123</span>
            </div>
            <div class="credential-row">
                <span><strong>Designer:</strong></span>
                <span>designer@mysteel.com / designer123</span>
            </div>
            <div class="credential-row">
                <span><strong>Production:</strong></span>
                <span>production@mysteel.com / production123</span>
            </div>
            <div class="credential-row">
                <span><strong>Installation:</strong></span>
                <span>installation@mysteel.com / installation123</span>
            </div>
        </div>
        
        <div id="status"></div>
        
        <div class="step">
            <h3>🧪 After Setup</h3>
            <p>Once setup is complete, you can:</p>
            <ul>
                <li>Login with any test account</li>
                <li>Test role-based access control</li>
                <li>View Master Tracker timeline</li>
                <li>Test real-time updates</li>
                <li>Verify offline functionality</li>
            </ul>
        </div>
    </div>
    
    <script>
        function openApp() {
            window.open('http://localhost:5173', '_blank');
            showStatus('Application opened in new tab. Press F12 to open console.', 'success');
        }
        
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showStatus('Command copied to clipboard!', 'success');
            }).catch(() => {
                showStatus('Please manually copy: ' + text, 'warning');
            });
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.innerHTML = '<div class="status ' + type + '">' + message + '</div>';
            setTimeout(() => {
                status.innerHTML = '';
            }, 3000);
        }
        
        // Auto-open application on load
        setTimeout(() => {
            openApp();
        }, 1000);
    </script>
</body>
</html>
  `;
  
  // Write the HTML file
  writeFileSync('database-setup.html', setupHtml);
  
  console.log('📋 Setup instructions created!');
  console.log('');
  console.log('🌐 Opening setup guide in your browser...');
  
  // Open the setup guide
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = 'open database-setup.html';
  } else if (platform === 'win32') {
    command = 'start database-setup.html';
  } else {
    command = 'xdg-open database-setup.html';
  }
  
  exec(command, (error) => {
    if (error) {
      console.log('❌ Could not auto-open browser. Please manually open: database-setup.html');
    } else {
      console.log('✅ Setup guide opened in browser!');
    }
    
    console.log('');
    console.log('📝 Manual Instructions:');
    console.log('======================');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Press F12 to open developer console');
    console.log('3. Go to Console tab');
    console.log('4. Run: setupCompleteDatabase()');
    console.log('5. Wait for completion');
    console.log('6. Use the test credentials to login');
    console.log('');
    console.log('🔑 Test Credentials:');
    console.log('Admin: admin@mysteel.com / admin123');
    console.log('Sales: sales@mysteel.com / sales123');
    console.log('Designer: designer@mysteel.com / designer123');
    console.log('Production: production@mysteel.com / production123');
    console.log('Installation: installation@mysteel.com / installation123');
  });
}

main().catch(console.error);
