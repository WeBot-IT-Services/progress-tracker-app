#!/usr/bin/env node

/**
 * Force Local Mode Authentication
 * This script helps bypass Firebase authentication issues by forcing local mode
 */

console.log('🔧 Force Local Mode Authentication');
console.log('==================================');

// Instructions for the user
console.log('');
console.log('To force local mode authentication:');
console.log('1. Open your browser developer tools (F12)');
console.log('2. Go to the Console tab');
console.log('3. Run the following command:');
console.log('');
console.log('   localStorage.setItem("forceLocalMode", "true");');
console.log('');
console.log('4. Refresh the page');
console.log('5. Try logging in with these credentials:');
console.log('');
console.log('   📧 Email: admin@mysteel.com');
console.log('   🗝️  Password: WR2024');
console.log('');
console.log('   📧 Email: sales@mysteel.com');
console.log('   🗝️  Password: WR2024');
console.log('');
console.log('   📧 Email: design@mysteel.com');
console.log('   🗝️  Password: WR2024');
console.log('');
console.log('Alternative employee ID login:');
console.log('   🆔 Employee ID: A0001');
console.log('   🗝️  Password: WR2024');
console.log('');
console.log('   🆔 Employee ID: S0001');
console.log('   🗝️  Password: WR2024');
console.log('');
console.log('To disable local mode:');
console.log('   localStorage.removeItem("forceLocalMode");');
console.log('');
console.log('✅ This will bypass Firebase authentication and use local auth.');
