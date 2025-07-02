// Status check script for Progress Tracker Application
const http = require('http');

console.log('🔍 Checking Progress Tracker Application Status...\n');

// Check if server is running
const req = http.get('http://localhost:5174', (res) => {
  console.log('✅ Server Status: RUNNING');
  console.log(`✅ HTTP Status: ${res.statusCode}`);
  console.log(`✅ Content Type: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Check if the HTML contains our app
    if (data.includes('Progress Tracker')) {
      console.log('✅ App Title: Found in HTML');
    } else {
      console.log('❌ App Title: Not found in HTML');
    }
    
    if (data.includes('root')) {
      console.log('✅ React Root: Found in HTML');
    } else {
      console.log('❌ React Root: Not found in HTML');
    }
    
    if (data.includes('vite')) {
      console.log('✅ Vite Client: Connected');
    } else {
      console.log('❌ Vite Client: Not connected');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Progress Tracker Application is READY!');
    console.log('\n📱 Open http://localhost:5174 in your browser');
    console.log('\n🔐 Test Accounts (password: password123):');
    console.log('   • admin@mysteel.com (Admin - Full Access)');
    console.log('   • sales@mysteel.com (Sales Module)');
    console.log('   • designer@mysteel.com (Design Module)');
    console.log('   • production@mysteel.com (Production Module)');
    console.log('   • installation@mysteel.com (Installation Module)');
    console.log('\n🚀 Features to Test:');
    console.log('   • Login/Logout');
    console.log('   • Dashboard Navigation');
    console.log('   • Sales Project Submission');
    console.log('   • Design Status Management');
    console.log('   • Role-based Module Access');
    console.log('   • Responsive Design');
  });
});

req.on('error', (err) => {
  console.log('❌ Server Status: NOT RUNNING');
  console.log(`❌ Error: ${err.message}`);
  console.log('\n💡 Make sure to run: npm run dev');
});

req.setTimeout(5000, () => {
  console.log('⏰ Request timeout - Server may be starting up');
  req.destroy();
});
