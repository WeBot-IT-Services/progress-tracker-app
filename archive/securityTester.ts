// Security Testing Utility for Firebase Rules
// This utility helps test role-based access control in development

import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs } from 'firebase/firestore';

interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

// Test users for different roles - Production credentials
export const TEST_USERS: TestUser[] = [
  { email: 'admin@mysteel.com', password: 'MS2024!Admin#Secure', role: 'admin', name: 'System Administrator' },
  { email: 'sales@mysteel.com', password: 'MS2024!Sales#Manager', role: 'sales', name: 'Sales Manager' },
  { email: 'design@mysteel.com', password: 'MS2024!Design#Engineer', role: 'designer', name: 'Design Engineer' },
  { email: 'production@mysteel.com', password: 'MS2024!Prod#Manager', role: 'production', name: 'Production Manager' },
  { email: 'installation@mysteel.com', password: 'MS2024!Install#Super', role: 'installation', name: 'Installation Manager' }
];

// Test project data
const TEST_PROJECT = {
  name: 'Security Test Project',
  description: 'Project for testing security rules',
  amount: 50000,
  completionDate: '2024-12-31',
  status: 'DNE',
  createdBy: '',
  progress: 0
};

// Test complaint data
const TEST_COMPLAINT = {
  title: 'Security Test Complaint',
  description: 'Complaint for testing security rules',
  customerName: 'Test Customer',
  projectId: 'test-project-id',
  status: 'open',
  priority: 'medium',
  createdBy: ''
};

// Test milestone data
const TEST_MILESTONE = {
  projectId: 'test-project-id',
  title: 'Security Test Milestone',
  description: 'Milestone for testing security rules',
  status: 'pending',
  dueDate: '2024-12-31'
};

export class SecurityTester {
  private currentUser: TestUser | null = null;
  private testResults: Array<{ test: string; result: 'PASS' | 'FAIL'; error?: string }> = [];

  // Login as a specific test user
  async loginAs(role: string): Promise<boolean> {
    try {
      const user = TEST_USERS.find(u => u.role === role);
      if (!user) {
        throw new Error(`Test user with role ${role} not found`);
      }

      await signInWithEmailAndPassword(auth, user.email, user.password);
      this.currentUser = user;
      console.log(`✅ Logged in as ${role}: ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to login as ${role}:`, error);
      return false;
    }
  }

  // Logout current user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
    }
  }

  // Test project operations
  async testProjectOperations(): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No user logged in');
      return;
    }

    const role = this.currentUser.role;
    console.log(`\n🧪 Testing Project Operations for ${role}...`);

    // Test project creation
    await this.testOperation('Create Project', async () => {
      const projectData = { ...TEST_PROJECT, createdBy: auth.currentUser?.uid || '' };
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      return docRef.id;
    });

    // Test project reading
    await this.testOperation('Read Projects', async () => {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      return querySnapshot.size;
    });

    // Test project update (if we have a project)
    const projects = await getDocs(collection(db, 'projects'));
    if (!projects.empty) {
      const projectId = projects.docs[0].id;
      
      await this.testOperation('Update Project Status', async () => {
        await updateDoc(doc(db, 'projects', projectId), {
          status: 'Production',
          progress: 50
        });
        return true;
      });

      await this.testOperation('Delete Project', async () => {
        await deleteDoc(doc(db, 'projects', projectId));
        return true;
      });
    }
  }

  // Test complaint operations
  async testComplaintOperations(): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No user logged in');
      return;
    }

    const role = this.currentUser.role;
    console.log(`\n🧪 Testing Complaint Operations for ${role}...`);

    // Test complaint creation
    await this.testOperation('Create Complaint', async () => {
      const complaintData = { ...TEST_COMPLAINT, createdBy: auth.currentUser?.uid || '' };
      const docRef = await addDoc(collection(db, 'complaints'), complaintData);
      return docRef.id;
    });

    // Test complaint reading
    await this.testOperation('Read Complaints', async () => {
      const querySnapshot = await getDocs(collection(db, 'complaints'));
      return querySnapshot.size;
    });
  }

  // Test milestone operations
  async testMilestoneOperations(): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No user logged in');
      return;
    }

    const role = this.currentUser.role;
    console.log(`\n🧪 Testing Milestone Operations for ${role}...`);

    // Test milestone creation
    await this.testOperation('Create Milestone', async () => {
      const docRef = await addDoc(collection(db, 'milestones'), TEST_MILESTONE);
      return docRef.id;
    });

    // Test milestone reading
    await this.testOperation('Read Milestones', async () => {
      const querySnapshot = await getDocs(collection(db, 'milestones'));
      return querySnapshot.size;
    });
  }

  // Test user operations
  async testUserOperations(): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No user logged in');
      return;
    }

    const role = this.currentUser.role;
    console.log(`\n🧪 Testing User Operations for ${role}...`);

    // Test reading own user profile
    await this.testOperation('Read Own Profile', async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
      return userDoc.exists();
    });

    // Test reading other users (should fail for non-admin)
    const users = await getDocs(collection(db, 'users'));
    if (users.size > 1) {
      const otherUserId = users.docs.find(doc => doc.id !== auth.currentUser?.uid)?.id;
      if (otherUserId) {
        await this.testOperation('Read Other User Profile', async () => {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          return userDoc.exists();
        });
      }
    }
  }

  // Helper method to test operations and record results
  private async testOperation(testName: string, operation: () => Promise<any>): Promise<void> {
    try {
      await operation();
      this.testResults.push({ test: `${this.currentUser?.role}: ${testName}`, result: 'PASS' });
      console.log(`✅ ${testName}: PASS`);
    } catch (error: any) {
      this.testResults.push({
        test: `${this.currentUser?.role}: ${testName}`,
        result: 'FAIL',
        error: error.message
      });
      console.log(`❌ ${testName}: FAIL - ${error.message}`);
    }
  }

  // Run comprehensive security tests for all roles
  async runComprehensiveTests(): Promise<void> {
    console.log('🔒 Starting Comprehensive Security Tests...\n');
    this.testResults = [];

    for (const user of TEST_USERS) {
      console.log(`\n👤 Testing Role: ${user.role.toUpperCase()}`);
      console.log('='.repeat(50));

      const loginSuccess = await this.loginAs(user.role);
      if (!loginSuccess) {
        continue;
      }

      // Test all operations for this role
      await this.testProjectOperations();
      await this.testComplaintOperations();
      await this.testMilestoneOperations();
      await this.testUserOperations();

      await this.logout();
      
      // Wait a bit between role tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.printTestSummary();
  }

  // Print test summary
  private printTestSummary(): void {
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.result === 'PASS').length;
    const failed = this.testResults.filter(r => r.result === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.result === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.error}`));
    }
    
    console.log('\n🎯 Expected Behavior:');
    console.log('   - Admin: Should pass most tests');
    console.log('   - Sales: Should fail admin-only operations');
    console.log('   - Designer: Should fail non-design operations');
    console.log('   - Production: Should fail non-production operations');
    console.log('   - Installation: Should fail creation operations');
  }

  // Get test results
  getTestResults() {
    return this.testResults;
  }
}

// Export singleton instance
export const securityTester = new SecurityTester();

// Console helper functions for manual testing
declare global {
  interface Window {
    testSecurity: () => Promise<void>;
    testRole: (role: string) => Promise<void>;
    loginAs: (role: string) => Promise<boolean>;
    logoutTest: () => Promise<void>;
  }
}

// Add to window for console access
if (typeof window !== 'undefined') {
  window.testSecurity = () => securityTester.runComprehensiveTests();
  window.testRole = async (role: string) => { await securityTester.loginAs(role); };
  window.loginAs = (role: string) => securityTester.loginAs(role);
  window.logoutTest = () => securityTester.logout();
}
