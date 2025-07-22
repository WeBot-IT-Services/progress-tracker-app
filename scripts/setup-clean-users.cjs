#!/usr/bin/env node

/**
 * Setup clean user accounts for the Progress Tracker App
 * This script creates fresh demo users with the default password
 */

console.log('👥 Setting up clean user accounts...');
console.log('===================================');

// User data to create
const users = [
  {
    employeeId: 'A0001',
    name: 'Admin User',
    email: 'admin@mysteel.com',
    role: 'admin',
    department: 'Administration',
    status: 'active'
  },
  {
    employeeId: 'S0001',
    name: 'Sales Manager',
    email: 'sales@mysteel.com',
    role: 'sales',
    department: 'Sales',
    status: 'active'
  },
  {
    employeeId: 'D0001',
    name: 'Design Lead',
    email: 'design@mysteel.com',
    role: 'designer',
    department: 'Design',
    status: 'active'
  },
  {
    employeeId: 'P0001',
    name: 'Production Manager',
    email: 'production@mysteel.com',
    role: 'production',
    department: 'Production',
    status: 'active'
  },
  {
    employeeId: 'I0001',
    name: 'Installation Lead',
    email: 'installation@mysteel.com',
    role: 'installation',
    department: 'Installation',
    status: 'active'
  }
];

console.log('✅ User accounts to be created:');
users.forEach(user => {
  console.log(`   ${user.employeeId} - ${user.name} (${user.role})`);
});

console.log('\n📋 Default Login Credentials:');
console.log('Employee ID: A0001 | Password: WR2024 | Role: Admin');
console.log('Employee ID: S0001 | Password: WR2024 | Role: Sales');
console.log('Employee ID: D0001 | Password: WR2024 | Role: Designer');
console.log('Employee ID: P0001 | Password: WR2024 | Role: Production');
console.log('Employee ID: I0001 | Password: WR2024 | Role: Installation');

console.log('\n🔧 To create these users:');
console.log('1. Deploy the app: npm run build && firebase deploy');
console.log('2. Open the app: https://mysteelprojecttracker.web.app');
console.log('3. Try logging in with A0001/WR2024');
console.log('4. If user doesn\'t exist, it will be created automatically');
console.log('5. Use Admin panel to create other users if needed');

console.log('\n🎯 The app will automatically:');
console.log('- Create users with default password WR2024');
console.log('- Set up proper roles and permissions');
console.log('- Enable password changes on first login');
console.log('- Provide admin tools for user management');

console.log('\n🚀 Ready to deploy and test!');
