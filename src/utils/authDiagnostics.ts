/**
 * Authentication Diagnostics Utility
 * 
 * This utility helps diagnose and fix authentication issues by:
 * 1. Checking user data in Firestore
 * 2. Verifying password hashes
 * 3. Testing authentication flow
 * 4. Fixing common issues
 */

import { usersService } from '../services/firebaseService';
import { hashPassword, verifyPassword } from './passwordUtils';
import EnhancedEmployeeIdAuthService from '../services/enhancedEmployeeIdAuth';

export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  fix?: () => Promise<void>;
}

export class AuthDiagnostics {
  
  /**
   * Run comprehensive authentication diagnostics
   */
  static async runDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    console.log('🔍 Running Authentication Diagnostics...');
    
    // Test 1: Check database connection
    try {
      const users = await usersService.getUsers();
      results.push({
        test: 'Database Connection',
        status: 'pass',
        message: `Connected successfully. Found ${users.length} users.`,
        details: { userCount: users.length }
      });
    } catch (error: any) {
      results.push({
        test: 'Database Connection',
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        details: { error }
      });
      return results; // Can't continue without database
    }
    
    // Test 2: Check demo users
    const demoUserResults = await this.checkDemoUsers();
    results.push(...demoUserResults);
    
    // Test 3: Test password hashing
    const hashingResult = await this.testPasswordHashing();
    results.push(hashingResult);
    
    // Test 4: Test authentication flow
    const authResults = await this.testAuthenticationFlow();
    results.push(...authResults);
    
    return results;
  }
  
  /**
   * Check demo users exist and have proper configuration
   */
  static async checkDemoUsers(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const demoUsers = [
      { id: 'A0001', name: 'Admin User', role: 'admin' },
      { id: 'S0001', name: 'Sales Manager', role: 'sales' },
      { id: 'D0001', name: 'Design Lead', role: 'designer' },
      { id: 'P0001', name: 'Production Manager', role: 'production' },
      { id: 'I0001', name: 'Installation Lead', role: 'installation' }
    ];
    
    const missingUsers = [];
    const usersNeedingFix = [];
    
    for (const demoUser of demoUsers) {
      try {
        const user = await usersService.getUserByEmployeeId(demoUser.id);
        
        if (!user) {
          missingUsers.push(demoUser);
          continue;
        }
        
        // Check if user needs fixing
        const needsFix = !user.passwordHash || !user.passwordSet || user.status !== 'active';
        if (needsFix) {
          usersNeedingFix.push({ ...demoUser, user, needsFix });
        }
        
      } catch (error) {
        missingUsers.push(demoUser);
      }
    }
    
    if (missingUsers.length > 0) {
      results.push({
        test: 'Demo Users Exist',
        status: 'fail',
        message: `Missing ${missingUsers.length} demo users`,
        details: { missingUsers },
        fix: () => this.createMissingDemoUsers(missingUsers)
      });
    } else {
      results.push({
        test: 'Demo Users Exist',
        status: 'pass',
        message: 'All demo users exist',
        details: { demoUsers }
      });
    }
    
    if (usersNeedingFix.length > 0) {
      results.push({
        test: 'Demo Users Configuration',
        status: 'warning',
        message: `${usersNeedingFix.length} demo users need configuration fixes`,
        details: { usersNeedingFix },
        fix: () => this.fixDemoUsers(usersNeedingFix)
      });
    } else {
      results.push({
        test: 'Demo Users Configuration',
        status: 'pass',
        message: 'All demo users properly configured'
      });
    }
    
    return results;
  }
  
  /**
   * Test password hashing functionality
   */
  static async testPasswordHashing(): Promise<DiagnosticResult> {
    try {
      const testPassword = 'WR2024';
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      
      // Test verification
      const isValid = await verifyPassword(testPassword, hash1);
      const isInvalid = await verifyPassword('wrongpassword', hash1);
      
      if (isValid && !isInvalid) {
        return {
          test: 'Password Hashing',
          status: 'pass',
          message: 'Password hashing working correctly',
          details: {
            hash1: hash1.substring(0, 16) + '...',
            hash2: hash2.substring(0, 16) + '...',
            consistent: hash1 === hash2,
            validPassword: isValid,
            invalidPassword: isInvalid
          }
        };
      } else {
        return {
          test: 'Password Hashing',
          status: 'fail',
          message: 'Password verification not working correctly',
          details: { isValid, isInvalid }
        };
      }
    } catch (error: any) {
      return {
        test: 'Password Hashing',
        status: 'fail',
        message: `Password hashing failed: ${error.message}`,
        details: { error }
      };
    }
  }
  
  /**
   * Test authentication flow for demo users
   */
  static async testAuthenticationFlow(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const demoUsers = ['A0001', 'S0001', 'D0001', 'P0001', 'I0001'];
    
    const authResults = [];
    
    for (const employeeId of demoUsers) {
      try {
        const user = await EnhancedEmployeeIdAuthService.login(employeeId, 'WR2024');
        authResults.push({
          employeeId,
          success: true,
          name: user.name,
          role: user.role
        });
      } catch (error: any) {
        authResults.push({
          employeeId,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = authResults.filter(r => r.success).length;
    const failCount = authResults.filter(r => !r.success).length;
    
    if (successCount === demoUsers.length) {
      results.push({
        test: 'Demo Authentication',
        status: 'pass',
        message: 'All demo users can authenticate',
        details: { authResults }
      });
    } else {
      results.push({
        test: 'Demo Authentication',
        status: 'fail',
        message: `${failCount} demo users failed authentication`,
        details: { authResults },
        fix: () => this.fixFailedAuthentications(authResults.filter(r => !r.success))
      });
    }
    
    return results;
  }
  
  /**
   * Create missing demo users
   */
  static async createMissingDemoUsers(missingUsers: any[]): Promise<void> {
    console.log('🔧 Creating missing demo users...');
    
    const passwordHash = await hashPassword('WR2024');
    
    for (const demoUser of missingUsers) {
      try {
        const userData = {
          employeeId: demoUser.id,
          name: demoUser.name,
          email: `${demoUser.id.toLowerCase()}@mysteel.com`,
          role: demoUser.role,
          department: this.getDepartmentFromRole(demoUser.role),
          status: 'active' as const,
          passwordHash,
          passwordSet: true,
          isTemporary: false
        };
        
        await usersService.createUser(userData);
        console.log(`✅ Created demo user: ${demoUser.id}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to create demo user ${demoUser.id}:`, error);
        throw error;
      }
    }
    
    console.log('✅ All missing demo users created');
  }
  
  /**
   * Fix demo users that have configuration issues
   */
  static async fixDemoUsers(usersNeedingFix: any[]): Promise<void> {
    console.log('🔧 Fixing demo user configurations...');
    
    const passwordHash = await hashPassword('WR2024');
    
    for (const userInfo of usersNeedingFix) {
      try {
        const updates: any = {};
        
        if (!userInfo.user.passwordHash) {
          updates.passwordHash = passwordHash;
        }
        
        if (!userInfo.user.passwordSet) {
          updates.passwordSet = true;
        }
        
        if (userInfo.user.status !== 'active') {
          updates.status = 'active';
        }
        
        if (Object.keys(updates).length > 0) {
          await usersService.updateUser(userInfo.id, updates);
          console.log(`✅ Fixed demo user: ${userInfo.id}`);
        }
        
      } catch (error: any) {
        console.error(`❌ Failed to fix demo user ${userInfo.id}:`, error);
        throw error;
      }
    }
    
    console.log('✅ All demo users fixed');
  }
  
  /**
   * Fix failed authentications by updating password hashes
   */
  static async fixFailedAuthentications(failedUsers: any[]): Promise<void> {
    console.log('🔧 Fixing failed authentications...');
    
    const passwordHash = await hashPassword('WR2024');
    
    for (const failedUser of failedUsers) {
      try {
        await usersService.updateUser(failedUser.employeeId, {
          passwordHash,
          passwordSet: true,
          status: 'active'
        });
        console.log(`✅ Fixed authentication for: ${failedUser.employeeId}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to fix authentication for ${failedUser.employeeId}:`, error);
        throw error;
      }
    }
    
    console.log('✅ All authentication issues fixed');
  }
  
  /**
   * Get department name from role
   */
  static getDepartmentFromRole(role: string): string {
    const departmentMap: Record<string, string> = {
      'admin': 'Administration',
      'sales': 'Sales',
      'designer': 'Design',
      'production': 'Production',
      'installation': 'Installation'
    };
    return departmentMap[role] || 'General';
  }
  
  /**
   * Quick fix for common authentication issues
   */
  static async quickFix(): Promise<void> {
    console.log('🚀 Running Quick Authentication Fix...');
    
    try {
      const results = await this.runDiagnostics();
      
      for (const result of results) {
        if (result.status === 'fail' && result.fix) {
          console.log(`🔧 Applying fix for: ${result.test}`);
          await result.fix();
        }
      }
      
      console.log('✅ Quick fix completed');
      
    } catch (error: any) {
      console.error('❌ Quick fix failed:', error);
      throw error;
    }
  }
}

// Export for browser console access
(window as any).AuthDiagnostics = AuthDiagnostics;
