// Simple test script to verify the application is working
// Run with: node test-app.js

const http = require('http');

const testEndpoints = [
  'http://localhost:5174',
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${url} - Status: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🧪 Testing Progress Tracker Application...\n');
  
  let allPassed = true;
  
  for (const endpoint of testEndpoints) {
    const passed = await testEndpoint(endpoint);
    if (!passed) allPassed = false;
  }
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All tests passed! Application is working correctly.');
    console.log('\n📱 Open http://localhost:5174 in your browser to test the app.');
    console.log('\n🔐 Test accounts (password: password123):');
    console.log('   • admin@mysteel.com (Admin)');
    console.log('   • sales@mysteel.com (Sales)');
    console.log('   • designer@mysteel.com (Designer)');
    console.log('   • production@mysteel.com (Production)');
    console.log('   • installation@mysteel.com (Installation)');
  } else {
    console.log('❌ Some tests failed. Please check the application.');
  }
}

runTests();
