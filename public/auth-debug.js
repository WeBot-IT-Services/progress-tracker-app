// Quick Authentication Test Script
// Run this in the browser console on the login page

console.log('🔐 Firebase Auth Debug - Testing Login Credentials');

const testAccounts = [
  { email: 'admin@mysteel.com', password: 'MS2024!Admin#Super', role: 'admin' },
  { email: 'sales@mysteel.com', password: 'MS2024!Sales#Super', role: 'sales' },
  { email: 'design@mysteel.com', password: 'MS2024!Design#Super', role: 'designer' },
  { email: 'production@mysteel.com', password: 'MS2024!Prod#Super', role: 'production' },
  { email: 'installation@mysteel.com', password: 'MS2024!Install#Super', role: 'installation' }
];

console.table(testAccounts);

console.log('\n📋 Copy one of these credential sets to test login:');
testAccounts.forEach((account, index) => {
  console.log(`\n${index + 1}. ${account.role.toUpperCase()}`);
  console.log(`   Email: ${account.email}`);
  console.log(`   Password: ${account.password}`);
});

console.log('\n🛠️ If login still fails, try these debugging steps:');
console.log('1. Clear browser cache and cookies');
console.log('2. Check Firebase Console for user existence');
console.log('3. Verify Firebase project configuration');
console.log('4. Check network connectivity');
console.log('5. Try incognito/private browsing mode');

// Auto-fill function (call this from console)
window.autoFillLogin = function(accountIndex = 0) {
  const account = testAccounts[accountIndex];
  if (!account) {
    console.error('Invalid account index. Use 0-4.');
    return;
  }
  
  const emailInput = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
  
  if (emailInput && passwordInput) {
    emailInput.value = account.email;
    passwordInput.value = account.password;
    
    // Trigger change events
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log(`✅ Auto-filled login for ${account.role}: ${account.email}`);
  } else {
    console.error('❌ Could not find email or password input fields');
  }
};

console.log('\n🚀 Quick Start: Run autoFillLogin(0) to auto-fill admin credentials');
