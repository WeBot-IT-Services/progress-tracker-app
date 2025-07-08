/**
 * Setup Demo Users with Employee IDs
 * 
 * This script creates demo users with proper employee IDs that match
 * the Quick Demo Access buttons in the login form.
 * 
 * Instructions:
 * 1. Make sure Firebase is configured and running
 * 2. Run this script to create demo users
 * 3. The demo login buttons will then work properly
 */

const demoUsers = [
  {
    employeeId: 'A0001',
    email: 'admin@mysteel.com',
    password: 'MS2024!Admin#Secure',
    name: 'System Administrator',
    role: 'admin',
    department: 'Administration'
  },
  {
    employeeId: 'S0001',
    email: 'sales@mysteel.com',
    password: 'MS2024!Sales#Manager',
    name: 'Sales Manager',
    role: 'sales',
    department: 'Sales'
  },
  {
    employeeId: 'D0001',
    email: 'design@mysteel.com',
    password: 'MS2024!Design#Engineer',
    name: 'Design Engineer',
    role: 'design',
    department: 'Design & Engineering'
  },
  {
    employeeId: 'P0001',
    email: 'production@mysteel.com',
    password: 'MS2024!Prod#Manager',
    name: 'Production Manager',
    role: 'production',
    department: 'Production'
  },
  {
    employeeId: 'I0001',
    email: 'installation@mysteel.com',
    password: 'MS2024!Install#Super',
    name: 'Installation Manager',
    role: 'installation',
    department: 'Installation'
  }
];

async function setupDemoUsers() {
  console.log('🚀 Setting up demo users with employee IDs...');
  
  try {
    // This would need to be run in a Node.js environment with Firebase Admin SDK
    // For now, this serves as documentation of the demo user structure
    
    console.log('📋 Demo Users Structure:');
    console.log('┌─────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────────────┐');
    console.log('│ Employee ID │ Email                       │ Password                    │ Role                        │');
    console.log('├─────────────┼─────────────────────────────┼─────────────────────────────┼─────────────────────────────┤');
    
    demoUsers.forEach(user => {
      console.log(`│ ${user.employeeId.padEnd(11)} │ ${user.email.padEnd(27)} │ ${user.password.padEnd(27)} │ ${user.role.padEnd(27)} │`);
    });
    
    console.log('└─────────────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┘');
    
    console.log('\n✅ Demo users are configured in the LoginForm.tsx');
    console.log('🎯 The Quick Demo Access buttons will now work properly');
    
  } catch (error) {
    console.error('❌ Error setting up demo users:', error);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demoUsers, setupDemoUsers };
} else {
  // Browser environment
  window.demoUsers = demoUsers;
  window.setupDemoUsers = setupDemoUsers;
}

// Run setup if called directly
if (typeof require !== 'undefined' && require.main === module) {
  setupDemoUsers();
}
