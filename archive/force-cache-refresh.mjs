#!/usr/bin/env node

/**
 * Force Cache Refresh Script
 * 
 * This script updates the service worker version and forces a cache refresh
 * to ensure the latest version is deployed.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read package.json to get current version
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const buildTimestamp = Date.now();

console.log('🔧 Force Cache Refresh');
console.log('======================');
console.log(`📦 Current Version: ${version}`);
console.log(`🕒 Build Timestamp: ${buildTimestamp}`);
console.log('');

// Update service worker file
const swPath = join('public', 'sw.js');
let swContent = readFileSync(swPath, 'utf8');

console.log('🔄 Updating service worker...');

// Update version and build timestamp
swContent = swContent.replace(
  /const VERSION = '[^']*';/,
  `const VERSION = '${version}';`
);

swContent = swContent.replace(
  /const BUILD_TIMESTAMP = \d+;/,
  `const BUILD_TIMESTAMP = ${buildTimestamp};`
);

// Update cache names to include build timestamp
swContent = swContent.replace(
  /const CACHE_NAME = `progress-tracker-v\${VERSION}[^`]*`;/,
  `const CACHE_NAME = \`progress-tracker-v\${VERSION}-\${BUILD_TIMESTAMP}\`;`
);

swContent = swContent.replace(
  /const STATIC_CACHE_NAME = `progress-tracker-static-v\${VERSION}[^`]*`;/,
  `const STATIC_CACHE_NAME = \`progress-tracker-static-v\${VERSION}-\${BUILD_TIMESTAMP}\`;`
);

swContent = swContent.replace(
  /const DYNAMIC_CACHE_NAME = `progress-tracker-dynamic-v\${VERSION}[^`]*`;/,
  `const DYNAMIC_CACHE_NAME = \`progress-tracker-dynamic-v\${VERSION}-\${BUILD_TIMESTAMP}\`;`
);

// Write updated service worker
writeFileSync(swPath, swContent);

console.log('✅ Service worker updated');
console.log(`   Version: ${version}`);
console.log(`   Build Timestamp: ${buildTimestamp}`);
console.log(`   Cache Names: progress-tracker-*-v${version}-${buildTimestamp}`);
console.log('');

// Update manifest.json version
const manifestPath = join('public', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Manifest version updated');
console.log('');

// Create a cache-busting HTML file for immediate refresh
const cacheBustHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cache Refresh - Progress Tracker</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 500px;
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
        }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { margin: 0 0 1rem 0; font-size: 2rem; }
        p { margin: 0 0 1.5rem 0; opacity: 0.9; line-height: 1.5; }
        .version { font-family: monospace; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 0.5rem; }
        button {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
        }
        button:hover { background: rgba(255, 255, 255, 0.3); }
        .status { margin-top: 1rem; font-size: 0.9rem; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔄</div>
        <h1>Cache Refresh Complete</h1>
        <p>Progress Tracker has been updated to version <span class="version">${version}</span></p>
        <p>All caches have been cleared and the service worker has been updated.</p>
        
        <button onclick="clearAllCaches()">Clear Browser Cache</button>
        <button onclick="forceReload()">Force Reload</button>
        <button onclick="goToApp()">Go to App</button>
        
        <div class="status" id="status">Ready</div>
    </div>

    <script>
        async function clearAllCaches() {
            const status = document.getElementById('status');
            status.textContent = 'Clearing caches...';
            
            try {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    status.textContent = 'All caches cleared!';
                } else {
                    status.textContent = 'Cache API not supported';
                }
            } catch (error) {
                status.textContent = 'Error clearing caches: ' + error.message;
            }
        }
        
        function forceReload() {
            window.location.reload(true);
        }
        
        function goToApp() {
            window.location.href = '/';
        }
        
        // Auto-clear caches on load
        window.addEventListener('load', () => {
            clearAllCaches();
        });
    </script>
</body>
</html>`;

writeFileSync(join('public', 'cache-refresh.html'), cacheBustHtml);

console.log('✅ Cache refresh page created at /cache-refresh.html');
console.log('');

console.log('🎯 CACHE REFRESH SUMMARY');
console.log('========================');
console.log('✅ Service worker version updated');
console.log('✅ Manifest version updated');
console.log('✅ Cache refresh page created');
console.log('');
console.log('📝 Next Steps:');
console.log('1. Visit /cache-refresh.html to clear browser caches');
console.log('2. Or manually clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)');
console.log('3. The app will now use the latest version');
console.log('');
console.log(`🚀 Version ${version} is ready!`);
