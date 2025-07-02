#!/usr/bin/env node

/**
 * Database Setup Script for Mysteel Progress Tracker
 * 
 * This script automates the creation of test users and seeding of sample data
 * for all modules in the Mysteel Construction Progress Tracker application.
 */

const puppeteer = require('puppeteer');

async function setupDatabase() {
  console.log('🚀 Starting automated database setup...');
  console.log('======================================');
  
  let browser;
  
  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the application to load
    await page.waitForTimeout(3000);
    
    // Execute the setup command
    console.log('⚙️ Executing database setup...');
    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        if (typeof window.setupCompleteDatabase === 'function') {
          window.setupCompleteDatabase()
            .then(() => {
              console.log('✅ Database setup completed successfully!');
              resolve();
            })
            .catch((error) => {
              console.error('❌ Database setup failed:', error);
              reject(error);
            });
        } else {
          reject(new Error('setupCompleteDatabase function not available'));
        }
      });
    });
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('🔑 Test Account Credentials:');
    console.log('============================');
    console.log('Admin: admin@mysteel.com / admin123');
    console.log('Sales: sales@mysteel.com / sales123');
    console.log('Designer: designer@mysteel.com / designer123');
    console.log('Production: production@mysteel.com / production123');
    console.log('Installation: installation@mysteel.com / installation123');
    console.log('');
    console.log('🧪 Ready for testing! You can now login with any of the above accounts.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Manual setup instructions
function showManualInstructions() {
  console.log('📋 Manual Setup Instructions:');
  console.log('=============================');
  console.log('');
  console.log('1. Open your browser and navigate to: http://localhost:5173');
  console.log('2. Open browser console (F12 → Console tab)');
  console.log('3. Run the following command:');
  console.log('   setupCompleteDatabase()');
  console.log('');
  console.log('4. Wait for completion message');
  console.log('5. Use the provided credentials to test the application');
  console.log('');
  console.log('🔑 Test Account Credentials:');
  console.log('============================');
  console.log('Admin: admin@mysteel.com / admin123');
  console.log('Sales: sales@mysteel.com / sales123');
  console.log('Designer: designer@mysteel.com / designer123');
  console.log('Production: production@mysteel.com / production123');
  console.log('Installation: installation@mysteel.com / installation123');
}

// Check if puppeteer is available
async function checkPuppeteer() {
  try {
    require('puppeteer');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual') || args.includes('-m')) {
    showManualInstructions();
    return;
  }
  
  const hasPuppeteer = await checkPuppeteer();
  
  if (!hasPuppeteer) {
    console.log('⚠️ Puppeteer not available. Showing manual instructions...');
    console.log('');
    showManualInstructions();
    console.log('');
    console.log('💡 To install Puppeteer for automated setup:');
    console.log('   npm install puppeteer --save-dev');
    return;
  }
  
  await setupDatabase();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupDatabase, showManualInstructions };
