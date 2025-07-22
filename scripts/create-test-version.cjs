#!/usr/bin/env node

/**
 * Create Test Version Script
 * Generates a new version.json to trigger PWA updates for testing
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Creating Test Version for PWA Updates');
console.log('========================================');

const versionJsonPath = path.join(__dirname, '../public/version.json');
const timestamp = Date.now();
const buildId = `test-build-${timestamp}`;
const version = '3.15.1';

const testVersion = {
  version: version,
  buildId: buildId,
  buildTimestamp: timestamp,
  buildDate: new Date().toISOString(),
  forceUpdate: false,
  minimumVersion: '3.15.0',
  updateMessage: `Test version ${version} is now available with PWA update fixes and enhanced functionality.`,
  updateUrl: 'https://mysteelprojecttracker.web.app',
  features: {
    employeeIdAuth: true,
    defaultPassword: true,
    enhancedPWA: true,
    autoUpdate: true,
    offlineSupport: true,
    fixedUpdateLoop: true,
    testVersion: true
  },
  changelog: [
    'Fixed PWA auto-update infinite loop issue',
    'Added proper user acceptance state management',
    'Enhanced version comparison logic',
    'Added debugging utilities for testing',
    'Improved update prompt user experience',
    'This is a test version to verify update functionality'
  ]
};

// Write the test version
fs.writeFileSync(versionJsonPath, JSON.stringify(testVersion, null, 2));

console.log('✅ Test version created successfully!');
console.log('');
console.log('📋 Test Version Details:');
console.log(`   Version: ${testVersion.version}`);
console.log(`   Build ID: ${testVersion.buildId}`);
console.log(`   Timestamp: ${testVersion.buildTimestamp}`);
console.log(`   Date: ${testVersion.buildDate}`);
console.log('');
console.log('🚀 Next Steps:');
console.log('1. Build the app: npm run build');
console.log('2. Deploy to Firebase: firebase deploy --only hosting');
console.log('3. Open the app in browser');
console.log('4. You should see an update prompt within 30 seconds');
console.log('');
console.log('🔍 To monitor the update process:');
console.log('1. Open browser developer tools');
console.log('2. Watch the console for update messages');
console.log('3. Use pwaDebug.enableDebug() for detailed logging');
console.log('');
console.log('⚠️  Remember to restore the original version.json after testing!');

// Create a backup of the original if it exists
const backupPath = path.join(__dirname, '../public/version.json.backup');
if (fs.existsSync(versionJsonPath) && !fs.existsSync(backupPath)) {
  try {
    const originalContent = fs.readFileSync(versionJsonPath, 'utf8');
    fs.writeFileSync(backupPath, originalContent);
    console.log('💾 Original version.json backed up to version.json.backup');
  } catch (error) {
    console.warn('⚠️  Could not create backup:', error.message);
  }
}
