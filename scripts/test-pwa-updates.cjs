#!/usr/bin/env node

/**
 * PWA Update Testing Script
 * Tests the update mechanism and provides debugging information
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 PWA Update Testing Script');
console.log('============================');

// Read current version files
const forceUpdateClientPath = path.join(__dirname, '../public/force-update-client.js');
const versionJsonPath = path.join(__dirname, '../public/version.json');

console.log('\n📋 Current Configuration:');
console.log('=========================');

// Extract version info from force-update-client.js
const clientContent = fs.readFileSync(forceUpdateClientPath, 'utf8');
const versionMatch = clientContent.match(/this\.version = '([^']+)'/);
const buildIdMatch = clientContent.match(/this\.buildId = '([^']+)'/);
const timestampMatch = clientContent.match(/this\.buildTimestamp = (\d+)/);

const clientVersion = versionMatch ? versionMatch[1] : 'unknown';
const clientBuildId = buildIdMatch ? buildIdMatch[1] : 'unknown';
const clientTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;

console.log(`📱 Client Version: ${clientVersion}`);
console.log(`📱 Client Build ID: ${clientBuildId}`);
console.log(`📱 Client Timestamp: ${clientTimestamp}`);

// Read server version
if (fs.existsSync(versionJsonPath)) {
  const serverVersion = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  console.log(`🌐 Server Version: ${serverVersion.version}`);
  console.log(`🌐 Server Build ID: ${serverVersion.buildId}`);
  console.log(`🌐 Server Timestamp: ${serverVersion.buildTimestamp}`);
  
  // Compare versions
  console.log('\n🔍 Version Comparison:');
  console.log('======================');
  
  const versionMatch = clientVersion === serverVersion.version;
  const buildIdMatch = clientBuildId === serverVersion.buildId;
  const timestampMatch = clientTimestamp === serverVersion.buildTimestamp;
  
  console.log(`Version Match: ${versionMatch ? '✅' : '❌'} (${clientVersion} vs ${serverVersion.version})`);
  console.log(`Build ID Match: ${buildIdMatch ? '✅' : '❌'} (${clientBuildId} vs ${serverVersion.buildId})`);
  console.log(`Timestamp Match: ${timestampMatch ? '✅' : '❌'} (${clientTimestamp} vs ${serverVersion.buildTimestamp})`);
  
  const shouldUpdate = !versionMatch || !buildIdMatch || (clientTimestamp < serverVersion.buildTimestamp - 60000);
  console.log(`\n🎯 Should Trigger Update: ${shouldUpdate ? '✅ YES' : '❌ NO'}`);
  
  if (!shouldUpdate) {
    console.log('\n⚠️  No update will be triggered with current configuration');
    console.log('💡 To test updates, you can:');
    console.log('   1. Run: node scripts/create-test-version.js');
    console.log('   2. Or manually edit version.json to have different buildId');
    console.log('   3. Or use browser console: pwaDebug.simulateUpdate()');
  }
} else {
  console.log('❌ version.json not found');
}

console.log('\n🛠️  Testing Instructions:');
console.log('=========================');
console.log('1. Build and deploy the app: npm run build && firebase deploy --only hosting');
console.log('2. Open the app in browser: https://mysteelprojecttracker.web.app');
console.log('3. Open browser developer tools (F12)');
console.log('4. Check console for update messages');
console.log('5. Use debug commands:');
console.log('   - pwaDebug.enableDebug() - Enable detailed logging');
console.log('   - pwaDebug.checkNow() - Force immediate update check');
console.log('   - pwaDebug.simulateUpdate() - Test update flow');
console.log('   - pwaDebug.getState() - View current update state');
console.log('   - pwaDebug.clearState() - Reset update state');

console.log('\n🔍 Expected Console Output:');
console.log('===========================');
console.log('🔄 Force Update Client initialized');
console.log('📱 Current version: 3.15.0 (d26bb59-1752013788877)');
console.log('🔍 Comparing versions: {...}');
if (shouldUpdate) {
  console.log('🔄 Build ID mismatch detected - update needed');
  console.log('🚨 Force update required: {...}');
  console.log('[Update prompt should appear]');
} else {
  console.log('✅ Client and server versions match exactly');
  console.log('✅ No update needed');
}

console.log('\n📊 Troubleshooting:');
console.log('===================');
console.log('If no update prompt appears:');
console.log('1. Check if versions actually differ');
console.log('2. Verify version.json is accessible');
console.log('3. Check browser console for errors');
console.log('4. Try: pwaDebug.simulateUpdate()');
console.log('');
console.log('If update loops occur:');
console.log('1. Check localStorage for pwa_update_state');
console.log('2. Try: pwaDebug.clearState()');
console.log('3. Verify URL parameters are cleaned up');
console.log('');
console.log('If updates don\'t complete:');
console.log('1. Check network connectivity');
console.log('2. Verify Firebase hosting is working');
console.log('3. Check for JavaScript errors');

console.log('\n🎯 Success Criteria:');
console.log('====================');
console.log('✅ Update prompt appears for new versions');
console.log('✅ No prompt for same version');
console.log('✅ User choice is respected and remembered');
console.log('✅ Updates complete successfully');
console.log('✅ No infinite loops');
console.log('✅ State persists across sessions');

console.log('\n🚀 Ready to test PWA updates!');
