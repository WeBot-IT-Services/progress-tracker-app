// Enhanced Employee ID Authentication Service (Secure Password Authentication)
import { usersService } from './firebaseService';
import { verifyPassword, hashPassword, createUserSession, type UserSession } from '../utils/passwordUtils';
import type { User as AppUser } from '../types';

interface EmployeeIdValidationResult {
  isValid: boolean;
  format: 'employeeId' | 'invalid';
  department?: string;
  formattedValue?: string;
  error?: string;
}

export class EnhancedEmployeeIdAuthService {
  // Employee ID format definitions - updated to match new format
  private static readonly EMPLOYEE_ID_PATTERNS = {
    admin: /^A\d{4}$/i,
    sales: /^S\d{4}$/i,
    design: /^D\d{4}$/i,
    production: /^P\d{4}$/i,
    installation: /^I\d{4}$/i,
    // Support for L prefix (Leadership/Legal/Logistics/etc.)
    leadership: /^L\d{4}$/i,
    // Support for generic numeric patterns
    generic: /^[A-Z]\d{4}$/i
  };

  /**
   * Validate and format employee ID
   */
  static validateIdentifier(identifier: string): EmployeeIdValidationResult {
    if (!identifier || identifier.trim().length === 0) {
      return {
        isValid: false,
        format: 'invalid',
        error: 'Employee ID is required'
      };
    }

    const trimmed = identifier.trim().toUpperCase();

    // Check if it's an employee ID
    const uppercase = trimmed.toUpperCase();
    
    for (const [department, pattern] of Object.entries(this.EMPLOYEE_ID_PATTERNS)) {
      if (pattern.test(uppercase)) {
        return {
          isValid: true,
          format: 'employeeId',
          department,
          formattedValue: uppercase
        };
      }
    }

    return {
      isValid: false,
      format: 'invalid',
      error: 'Invalid Employee ID format. Use format: A0001, S0001, D0001, P0001, I0001, or L0001'
    };
  }

  /**
   * Check if this is a demo user that should use the standard demo password
   */
  private static isDemoUser(employeeId: string): boolean {
    const demoIds = ['A0001', 'S0001', 'D0001', 'P0001', 'I0001'];
    return demoIds.includes(employeeId.toUpperCase());
  }

  /**
   * Auto-migrate user to include password hash if missing
   */
  private static async migrateUserPasswordHash(user: any, password: string): Promise<string> {
    console.log(`🔄 Auto-migrating user ${user.employeeId} to include password hash...`);

    try {
      // For demo users, ensure they use the standard demo password
      let migrationPassword = password;
      if (this.isDemoUser(user.employeeId) && password === 'WR2024') {
        migrationPassword = 'WR2024';
        console.log(`   📝 Using standard demo password for ${user.employeeId}`);
      }

      // Generate hash for the provided password
      console.log(`   🔐 Generating password hash...`);
      const passwordHash = await hashPassword(migrationPassword);
      console.log(`   ✅ Password hash generated: ${passwordHash.substring(0, 16)}...`);

      // Update user with the password hash
      console.log(`   💾 Updating user record in database...`);
      await usersService.updateUser(user.employeeId, {
        passwordHash,
        passwordSet: true,
        updatedAt: new Date()
      });

      console.log(`✅ User ${user.employeeId} successfully migrated with password hash`);
      return passwordHash;
    } catch (migrationError: any) {
      console.error(`❌ Failed to migrate user ${user.employeeId}:`, migrationError);

      // Provide specific error messages for common issues
      if (migrationError.message?.includes('digest')) {
        throw new Error('Password hashing not available in this environment. Please contact your administrator.');
      } else if (migrationError.message?.includes('crypto')) {
        throw new Error('Cryptographic functions not available. Please contact your administrator.');
      } else {
        throw new Error(`Account migration failed: ${migrationError.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Secure Employee ID + Password authentication
   */
  static async login(employeeId: string, password: string): Promise<AppUser> {
    // Skip format validation - accept any employee ID format
    const cleanEmployeeId = employeeId.trim().toUpperCase();

    if (!password || password.trim().length === 0) {
      throw new Error('Password is required');
    }

    try {
      // Get user by employee ID
      const user = await usersService.getUserByEmployeeId(cleanEmployeeId);
      if (!user) {
        throw new Error(`No account found with Employee ID: ${cleanEmployeeId}`);
      }

      console.log(`🔍 User found:`, {
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        status: user.status,
        passwordSet: user.passwordSet,
        hasPasswordHash: !!user.passwordHash,
        isDemoUser: this.isDemoUser(user.employeeId)
      });

      // Check if user is active
      if (user.status && user.status !== 'active') {
        throw new Error('Account is not active. Please contact your administrator.');
      }

      // Handle password verification with automatic migration
      let passwordHash = user.passwordHash;

      // Auto-migration: If user has passwordSet: true but no passwordHash,
      // automatically generate and store the hash for the provided password
      if (!passwordHash && user.passwordSet) {
        console.log(`🔄 User ${employeeId} missing password hash, attempting migration...`);

        // For demo users, ensure they're using the correct demo password
        if (this.isDemoUser(user.employeeId)) {
          if (password !== 'WR2024') {
            throw new Error('Demo users must use password "WR2024". Please try again.');
          }
          console.log(`   📝 Demo user ${employeeId} detected, using standard demo password`);
        }

        // Migrate user with the provided password
        passwordHash = await this.migrateUserPasswordHash(user, password);
      } else if (!passwordHash && !user.passwordSet) {
        throw new Error('Account password not set. Please contact your administrator.');
      }

      const isPasswordValid = await verifyPassword(password, passwordHash);
      if (!isPasswordValid) {
        // Audit failed login attempt
        await this.auditLoginAttempt(employeeId, false);
        throw new Error('Invalid password. Please check your credentials and try again.');
      }

      // Update last login time (non-critical operation)
      try {
        console.log(`🕒 Updating last login time for ${user.employeeId}...`);
        await usersService.updateLastLogin(user.employeeId);
        console.log(`   ✅ Last login time updated successfully`);
      } catch (lastLoginError) {
        console.warn(`⚠️ Failed to update last login time (non-critical):`, lastLoginError);
        // Don't fail the entire login process for this
      }

      // Audit successful login attempt
      await this.auditLoginAttempt(employeeId, true);

      console.log(`🎉 Login successful for ${user.employeeId} (${user.name})`);

      // Convert to AppUser type with required fields
      const appUser: AppUser = {
        ...user,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      };

      return appUser;
    } catch (error: any) {
      console.error('Login error:', error);

      // Audit failed login attempt for non-password errors
      if (!error.message.includes('Invalid password')) {
        await this.auditLoginAttempt(employeeId, false);
      }

      // Enhanced error handling for employee ID authentication
      if (error.message.includes('No account found')) {
        throw new Error(`No account found with Employee ID: ${cleanEmployeeId}`);
      } else if (error.message.includes('not active')) {
        throw new Error('Account is not active. Please contact your administrator.');
      }

      throw error;
    }
  }

  /**
   * Generate next employee ID for a department
   */
  static async generateNextEmployeeId(department: string): Promise<string> {
    const departmentCodes = {
      sales: 'SAL',
      design: 'DES',
      production: 'PRD',
      installation: 'INS',
      admin: 'ADM'
    };

    const code = departmentCodes[department as keyof typeof departmentCodes];
    if (!code) {
      throw new Error('Invalid department');
    }

    // Get all users in this department
    const users = await usersService.getUsers();
    const departmentUsers = users.filter(user => 
      user.employeeId && user.employeeId.startsWith(code)
    );

    // Find the highest number
    let maxNumber = 0;
    departmentUsers.forEach(user => {
      const match = user.employeeId?.match(/\d+$/);
      if (match) {
        const number = parseInt(match[0], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    // Generate next ID
    const nextNumber = maxNumber + 1;
    return `${code}${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Check if employee ID exists
   */
  static async isEmployeeIdAvailable(employeeId: string): Promise<boolean> {
    const validation = this.validateIdentifier(employeeId);
    if (validation.format !== 'employeeId') {
      return false;
    }

    const user = await usersService.getUserByEmployeeId(validation.formattedValue!);
    return user === null;
  }

  /**
   * Get department from employee ID
   */
  static getDepartmentFromEmployeeId(employeeId: string): string | null {
    const validation = this.validateIdentifier(employeeId);
    return validation.department || null;
  }

  /**
   * Format employee ID display (mask for security)
   */
  static formatEmployeeIdDisplay(employeeId: string, masked: boolean = false): string {
    if (!employeeId) return '';
    
    if (masked && employeeId.length > 3) {
      return employeeId.substring(0, 3) + '***';
    }
    
    return employeeId.toUpperCase();
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string, employeeId?: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let score = 0;

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Check if password contains employee ID
    if (employeeId && password.toUpperCase().includes(employeeId.toUpperCase())) {
      errors.push('Password cannot contain your employee ID');
      score = Math.max(0, score - 2);
    }

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password cannot contain common words');
      score = Math.max(0, score - 1);
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 4) strength = 'strong';
    else if (score >= 2) strength = 'medium';

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  /**
   * Audit login attempt
   */
  static async auditLoginAttempt(
    identifier: string, 
    success: boolean, 
    ip?: string, 
    userAgent?: string
  ): Promise<void> {
    try {
      const validation = this.validateIdentifier(identifier);
      const auditData = {
        timestamp: new Date(),
        identifier: validation.format === 'employeeId' ? 
          this.formatEmployeeIdDisplay(identifier, true) : // Mask employee ID
          identifier.includes('@') ? identifier.replace(/(.{2})[^@]*(@.*)/, '$1***$2') : // Mask email
          identifier,
        identifierType: validation.format,
        success,
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown'
      };

      // Log to console (in production, send to audit service)
      console.log('🔐 Login Audit:', auditData);
      
      // TODO: Implement proper audit logging service
      // await auditService.logLoginAttempt(auditData);
    } catch (error) {
      console.error('Failed to audit login attempt:', error);
    }
  }
}

export default EnhancedEmployeeIdAuthService;
