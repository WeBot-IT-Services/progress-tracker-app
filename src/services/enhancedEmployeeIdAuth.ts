// Enhanced Employee ID Authentication Service
import { usersService } from './firebaseService';
import type { User as AppUser } from '../types';

interface EmployeeIdValidationResult {
  isValid: boolean;
  format: 'email' | 'employeeId' | 'invalid';
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

  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validate and format identifier (email or employee ID)
   */
  static validateIdentifier(identifier: string): EmployeeIdValidationResult {
    if (!identifier || identifier.trim().length === 0) {
      return {
        isValid: false,
        format: 'invalid',
        error: 'Identifier is required'
      };
    }

    const trimmed = identifier.trim();

    // Check if it's an email
    if (this.EMAIL_PATTERN.test(trimmed)) {
      return {
        isValid: true,
        format: 'email',
        formattedValue: trimmed.toLowerCase()
      };
    }

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
      error: 'Invalid format. Use email or Employee ID (e.g., A0001, S0001, L0001)'
    };
  }

  /**
   * Enhanced login with better error handling and validation
   */
  static async login(identifier: string, password: string): Promise<AppUser> {
    const validation = this.validateIdentifier(identifier);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid identifier format');
    }

    try {
      let email = validation.formattedValue!;

      // If it's an employee ID, resolve to email
      if (validation.format === 'employeeId') {
        const user = await usersService.getUserByEmployeeId(validation.formattedValue!);
        if (!user) {
          throw new Error(`No account found with Employee ID: ${validation.formattedValue}`);
        }
        if (user.status && user.status !== 'active') {
          throw new Error('Account is not active. Please contact your administrator.');
        }
        email = user.email;
      }

      // Proceed with Firebase authentication using email
      const { firebaseLogin } = await import('./firebaseAuth');
      const user = await firebaseLogin(email, password);

      // Update last login time
      if (user.uid) {
        await usersService.updateLastLogin(user.uid);
      }

      return user;
    } catch (error: any) {
      // Enhanced error handling
      if (error.code === 'auth/user-not-found') {
        if (validation.format === 'email') {
          throw new Error('No account found with this email address');
        } else {
          throw new Error('No account found with this Employee ID');
        }
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('Account has been disabled. Please contact your administrator.');
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
