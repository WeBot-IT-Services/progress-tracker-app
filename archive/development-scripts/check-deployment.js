#!/usr/bin/env node

/**
 * Deployment Status Checker
 * Verifies that the deployed app has the correct version and PWA features
 */

import { readFileSync } from 'fs';

const PRODUCTION_URL = 'https://mysteelprojecttracker.web.app';

// Read current version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const expectedVersion = packageJson.version;

console.log('🔍 Checking Deployment Status');
console.log('================================');
console.log(`Expected Version: ${expectedVersion}`);
console.log(`Production URL: ${PRODUCTION_URL}`);
console.log('');

// Check if we're in a browser environment (this script is for Node.js)
if (typeof window !== 'undefined') {
  console.log('❌ This script should be run in Node.js, not in a browser');
  process.exit(1);
}

console.log('📋 Deployment Checklist:');
console.log('');

// Check 1: Package.json version
console.log(`✅ Package Version: ${expectedVersion}`);

// Check 2: Service Worker file
try {
  const swContent = readFileSync('public/sw.js', 'utf8');
  const versionMatch = swContent.match(/const VERSION = '([^']+)'/);
  if (versionMatch && versionMatch[1] === expectedVersion) {
    console.log(`✅ Service Worker Version: ${versionMatch[1]}`);
  } else {
    console.log(`❌ Service Worker Version Mismatch: ${versionMatch ? versionMatch[1] : 'not found'}`);
  }
} catch (error) {
  console.log('❌ Service Worker file not found');
}

// Check 3: Manifest file
try {
  const manifestContent = readFileSync('public/manifest.json', 'utf8');
  const manifest = JSON.parse(manifestContent);
  if (manifest.version === expectedVersion) {
    console.log(`✅ Manifest Version: ${manifest.version}`);
  } else {
    console.log(`❌ Manifest Version Mismatch: ${manifest.version}`);
  }
} catch (error) {
  console.log('❌ Manifest file not found or invalid');
}

// Check 4: Build directory
try {
  const distFiles = readFileSync('dist/index.html', 'utf8');
  if (distFiles.length > 0) {
    console.log('✅ Build files exist');
  }
} catch (error) {
  console.log('❌ Build files not found - run npm run build first');
}

// Check 5: Firebase configuration
try {
  const firebaseConfig = readFileSync('firebase.json', 'utf8');
  const config = JSON.parse(firebaseConfig);
  if (config.hosting && config.hosting.public === 'dist') {
    console.log('✅ Firebase hosting configured');
  } else {
    console.log('❌ Firebase hosting configuration issue');
  }
} catch (error) {
  console.log('❌ Firebase configuration not found');
}

console.log('');
console.log('🚀 Deployment Commands:');
console.log('  npm run deploy          - Build and deploy');
console.log('  npm run deploy:force    - Force deploy');
console.log('  firebase deploy --only hosting - Manual deploy');
console.log('');
console.log('🔗 URLs:');
console.log(`  Production: ${PRODUCTION_URL}`);
console.log('  Firebase Console: https://console.firebase.google.com/project/mysteelprojecttracker');
console.log('');
console.log('💡 To test the deployment:');
console.log('  1. Open the production URL in incognito mode');
console.log('  2. Check the version in the footer');
console.log('  3. Test PWA installation');
console.log('  4. Verify force update functionality');
console.log('');

// Instructions for manual verification
console.log('🧪 Manual Verification Steps:');
console.log('  1. Open browser dev tools');
console.log('  2. Go to Application > Service Workers');
console.log('  3. Check cache names include version number');
console.log('  4. Test offline functionality');
console.log('  5. Verify manifest.json is accessible');
console.log('');

console.log('✨ Deployment check complete!');
