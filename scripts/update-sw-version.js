#!/usr/bin/env node

/**
 * Script to update service worker version during build
 * Ensures the service worker always has the correct version and build timestamp
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read package.json to get current version
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const buildTimestamp = Date.now();

console.log(`🔧 Updating service worker version to ${version} (build: ${buildTimestamp})`);

// Read service worker file
const swPath = join('public', 'sw.js');
let swContent = readFileSync(swPath, 'utf8');

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

console.log(`✅ Service worker updated successfully`);
console.log(`   Version: ${version}`);
console.log(`   Build Timestamp: ${buildTimestamp}`);
console.log(`   Cache Names: progress-tracker-*-v${version}-${buildTimestamp}`);

// Also update manifest.json version
const manifestPath = join('public', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Manifest version updated to ${version}`);
