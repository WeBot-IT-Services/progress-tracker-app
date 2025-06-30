import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserRole } from '../types';

/**
 * Utility functions for managing user roles in Firebase
 */

export interface UserRoleInfo {
  uid: string;
  email: string;
  role: UserRole;
  hasValidRole: boolean;
}

/**
 * Check if a user has a valid role set in Firestore
 */
export const checkUserRole = async (uid: string): Promise<UserRoleInfo | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      console.warn(`User document not found for UID: ${uid}`);
      return null;
    }
    
    const userData = userDoc.data();
    const hasValidRole = userData.role && ['admin', 'sales', 'designer', 'production', 'installation'].includes(userData.role);
    
    return {
      uid,
      email: userData.email || '',
      role: userData.role || 'sales',
      hasValidRole
    };
  } catch (error) {
    console.error('Error checking user role:', error);
    return null;
  }
};

/**
 * Set or update a user's role in Firestore
 */
export const setUserRole = async (uid: string, role: UserRole, email?: string): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userDocRef, {
        role,
        updatedAt: new Date()
      });
      console.log(`✅ Updated user role: ${uid} -> ${role}`);
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        email: email || '',
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Created user document: ${uid} -> ${role}`);
    }
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

/**
 * Ensure current user has the installation role for testing
 */
export const ensureInstallationRole = async (uid: string, email?: string): Promise<void> => {
  try {
    await setUserRole(uid, 'installation', email);
    console.log('🔧 User role set to installation for testing');
  } catch (error) {
    console.error('Failed to set installation role:', error);
    throw error;
  }
};

/**
 * Debug function to check and fix user roles
 */
export const debugUserRole = async (uid: string, email?: string): Promise<void> => {
  console.log('🔍 Debugging user role...');

  try {
    const roleInfo = await checkUserRole(uid);

    if (!roleInfo) {
      console.log('❌ User document not found, creating with default sales role...');
      await setUserRole(uid, 'sales', email);
      return;
    }

    console.log('📋 Current user info:', roleInfo);

    if (!roleInfo.hasValidRole) {
      console.log('❌ Invalid role detected, setting to default sales role...');
      await setUserRole(uid, 'sales', email);
    } else {
      console.log('✅ User has valid role:', roleInfo.role);
    }
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

/**
 * Get demo credentials for testing
 */
export const getDemoCredentials = () => {
  return {
    admin: { email: 'admin@warehouseracking.my', password: 'WR2024!Admin#Super' },
    sales: { email: 'sales@warehouseracking.my', password: 'WR2024!Sales#Super' },
    design: { email: 'design@warehouseracking.my', password: 'WR2024!Design#Super' },
    production: { email: 'production@warehouseracking.my', password: 'WR2024!Production#Super' },
    installation: { email: 'installation@warehouseracking.my', password: 'WR2024!Install#Super' }
  };
};

/**
 * Quick fix function to set current user as installation role
 */
export const quickFixInstallationRole = async (currentUser: any): Promise<void> => {
  if (!currentUser) {
    console.error('No current user provided');
    return;
  }
  
  try {
    console.log('🔧 Quick fix: Setting user as installation role...');
    await setUserRole(currentUser.uid, 'installation', currentUser.email);
    console.log('✅ Quick fix completed! Please refresh the page.');
    
    // Show user-friendly message
    if (typeof window !== 'undefined') {
      alert('User role has been set to Installation. Please refresh the page and try uploading photos again.');
    }
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    if (typeof window !== 'undefined') {
      alert('Failed to fix user role. Please check console for details.');
    }
  }
};
