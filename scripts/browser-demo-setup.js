/**
 * Browser Console Demo User Setup
 * 
 * Copy and paste this script into the browser console when the app is running
 * to create demo users with proper employee IDs and password hashes.
 */

// Demo user setup function for browser console
async function setupDemoUsersInBrowser() {
  console.log('🚀 Setting up demo users in browser...');
  
  // Check if Firebase is available
  if (typeof window === 'undefined' || !window.firebase) {
    console.error('❌ Firebase not available. Make sure the app is running.');
    return;
  }

  // Password hash for "WR2024"
  const passwordHash = '79daf4758343c745343debd60f51a057923ca343fdc2df42c7b38b6919566749';
  
  // Demo users configuration
  const demoUsers = [
    {
      employeeId: 'A0001',
      name: 'Admin User',
      role: 'admin',
      department: 'Administration'
    },
    {
      employeeId: 'S0001',
      name: 'Sales Manager',
      role: 'sales',
      department: 'Sales'
    },
    {
      employeeId: 'D0001',
      name: 'Design Lead',
      role: 'designer',
      department: 'Design'
    },
    {
      employeeId: 'P0001',
      name: 'Production Manager',
      role: 'production',
      department: 'Production'
    },
    {
      employeeId: 'I0001',
      name: 'Installation Lead',
      role: 'installation',
      department: 'Installation'
    }
  ];

  try {
    // Get Firestore instance
    const db = window.firebase.firestore();
    
    console.log('📝 Creating demo users...');
    
    for (const demoUser of demoUsers) {
      console.log(`\n👤 Processing ${demoUser.name} (${demoUser.employeeId})...`);
      
      const userData = {
        employeeId: demoUser.employeeId,
        name: demoUser.name,
        role: demoUser.role,
        department: demoUser.department,
        status: 'active',
        passwordHash: passwordHash,
        passwordSet: true,
        isTemporary: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Use employee ID as document ID
      await db.collection('users').doc(demoUser.employeeId).set(userData, { merge: true });
      console.log(`   ✅ ${demoUser.employeeId} created/updated`);
    }
    
    console.log('\n🎉 Demo users setup completed!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('==========================');
    demoUsers.forEach(user => {
      console.log(`Employee ID: ${user.employeeId} | Password: WR2024 | Role: ${user.role}`);
    });
    
    console.log('\n🧪 You can now test the demo login buttons!');
    
  } catch (error) {
    console.error('❌ Error setting up demo users:', error);
  }
}

// Verification function
async function verifyDemoUsers() {
  console.log('🔍 Verifying demo users...');
  
  if (typeof window === 'undefined' || !window.firebase) {
    console.error('❌ Firebase not available.');
    return;
  }

  const db = window.firebase.firestore();
  const expectedHash = '79daf4758343c745343debd60f51a057923ca343fdc2df42c7b38b6919566749';
  const demoIds = ['A0001', 'S0001', 'D0001', 'P0001', 'I0001'];
  
  for (const employeeId of demoIds) {
    try {
      const doc = await db.collection('users').doc(employeeId).get();
      
      if (doc.exists) {
        const data = doc.data();
        const isValid = data.passwordHash === expectedHash && 
                       data.status === 'active' && 
                       data.passwordSet === true;
        
        console.log(`${isValid ? '✅' : '❌'} ${employeeId}: ${data.name} - ${isValid ? 'Ready' : 'Issues detected'}`);
        
        if (!isValid) {
          console.log(`   Issues:`, {
            passwordHashMatch: data.passwordHash === expectedHash,
            isActive: data.status === 'active',
            passwordSet: data.passwordSet === true,
            actualHash: data.passwordHash ? data.passwordHash.substring(0, 16) + '...' : 'missing'
          });
        }
      } else {
        console.log(`❌ ${employeeId}: Not found`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${employeeId}:`, error);
    }
  }
}

// Instructions
console.log(`
🎯 Demo User Setup Instructions
===============================

1. Copy and paste this entire script into the browser console
2. Run: setupDemoUsersInBrowser()
3. Verify: verifyDemoUsers()
4. Test the demo login buttons in the app

Available functions:
- setupDemoUsersInBrowser() - Creates/updates demo users
- verifyDemoUsers() - Checks if demo users are set up correctly

Expected password hash for "WR2024":
79daf4758343c745343debd60f51a057923ca343fdc2df42c7b38b6919566749
`);

// Make functions available globally
if (typeof window !== 'undefined') {
  window.setupDemoUsersInBrowser = setupDemoUsersInBrowser;
  window.verifyDemoUsers = verifyDemoUsers;
}
