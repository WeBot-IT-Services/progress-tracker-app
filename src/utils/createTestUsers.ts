import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserRole } from '../types';

interface TestUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// Test users with different roles
export const testUsers: TestUser[] = [
  {
    email: 'admin@mysteel.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'sales@mysteel.com',
    password: 'sales123',
    name: 'Sales Manager',
    role: 'sales'
  },
  {
    email: 'designer@mysteel.com',
    password: 'designer123',
    name: 'Design Engineer',
    role: 'designer'
  },
  {
    email: 'production@mysteel.com',
    password: 'production123',
    name: 'Production Manager',
    role: 'production'
  },
  {
    email: 'installation@mysteel.com',
    password: 'installation123',
    name: 'Installation Supervisor',
    role: 'installation'
  }
];

export const createTestUser = async (userData: TestUser): Promise<string> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    // Create user document in Firestore
    const userDoc = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: 'active',
      createdAt: serverTimestamp(),
      lastLogin: null
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

    console.log(`✅ Created user: ${userData.name} (${userData.email})`);
    return userCredential.user.uid;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ User ${userData.email} already exists, skipping...`);
      return 'existing';
    } else {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
      throw error;
    }
  }
};

export const createAllTestUsers = async (): Promise<void> => {
  console.log('🔐 Creating test users for all roles...');
  
  const results = [];
  
  for (const userData of testUsers) {
    try {
      const result = await createTestUser(userData);
      results.push({ ...userData, success: true, uid: result });
    } catch (error) {
      results.push({ ...userData, success: false, error });
    }
  }

  console.log('\n📊 Test User Creation Summary:');
  console.log('================================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.role.toUpperCase()}: ${result.email}`);
    if (!result.success) {
      console.log(`   Error: ${'error' in result ? result.error : 'Unknown error'}`);
    }
  });

  console.log('\n🔑 Login Credentials:');
  console.log('=====================');
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log('');
  });

  console.log('💡 You can now test the application with these accounts!');
};

// Function to display login credentials
export const displayLoginCredentials = () => {
  console.log('\n🔑 Test Account Login Credentials:');
  console.log('==================================');
  
  testUsers.forEach(user => {
    console.log(`\n${user.role.toUpperCase()} ROLE:`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔒 Password: ${user.password}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🎯 Access: ${getAccessDescription(user.role)}`);
  });
  
  console.log('\n📝 Notes:');
  console.log('• All passwords are simple for testing purposes');
  console.log('• Admin can see all modules and amounts');
  console.log('• Each role has specific permissions and access');
  console.log('• Use these accounts to test role-based functionality');
};

const getAccessDescription = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Full access to all modules, user management, analytics';
    case 'sales':
      return 'Sales module, project creation, complaints viewing';
    case 'designer':
      return 'Design module, project status updates';
    case 'production':
      return 'Production module, milestone management';
    case 'installation':
      return 'Installation module, photo uploads, progress updates';
    default:
      return 'Limited access';
  }
};

// Export for easy access in console
(window as any).createTestUsers = createAllTestUsers;
(window as any).showLoginCredentials = displayLoginCredentials;
