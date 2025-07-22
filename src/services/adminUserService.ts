// Admin User Service
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { User } from '../types';

export const adminUserService = {
  // Check if user exists by employee ID (password functionality removed)
  checkUserStatus: async (employeeId: string) => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('employeeId', '==', employeeId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          exists: false,
          message: 'User not found'
        };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      return {
        exists: true,
        isTemporary: userData.isTemporary || false,
        user: userData
      };
    } catch (error) {
      console.error('Error checking user status:', error);
      return {
        exists: false,
        error: error.message
      };
    }
  },

  // Legacy method for backward compatibility
  checkPasswordStatus: async (email: string) => {
    console.warn('checkPasswordStatus is deprecated - use checkUserStatus with employee ID instead');
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          exists: false,
          needsPassword: false,
          message: 'User not found'
        };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      return {
        exists: true,
        needsPassword: false, // Password functionality removed
        isTemporary: userData.isTemporary || false,
        passwordSet: true,    // Always true since passwords are removed
        user: userData
      };
    } catch (error) {
      console.error('Error checking password status:', error);
      return {
        exists: false,
        needsPassword: false,
        error: error.message
      };
    }
  },

  // Update user status (password functionality removed)
  updateUserStatus: async (employeeId: string, isTemporary: boolean = false) => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const userRef = doc(db, 'users', employeeId);
      await updateDoc(userRef, {
        isTemporary,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  updatePasswordStatus: async (userId: string, passwordSet: boolean = true, isTemporary: boolean = false) => {
    console.warn('updatePasswordStatus is deprecated - use updateUserStatus with employee ID instead');
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        passwordSet: true, // Always true since passwords are removed
        isTemporary,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating password status:', error);
      throw error;
    }
  },

  // Get user by employee ID
  getUserByEmployeeId: async (employeeId: string) => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('employeeId', '==', employeeId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return {
        ...userData
      } as User;
    } catch (error) {
      console.error('Error getting user by employee ID:', error);
      return null;
    }
  },

  // Legacy method for backward compatibility
  getUserByEmail: async (email: string) => {
    console.warn('getUserByEmail is deprecated - use getUserByEmployeeId instead');
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return {
        uid: userDoc.id,
        ...userData
      } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  // Create temporary user using employee ID (admin function)
  createTemporaryUser: async (employeeId: string, name: string, role: string) => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Create user directly in Firestore using employee ID
      const userData = {
        employeeId,
        name,
        role,
        status: 'active',
        isTemporary: true,
        passwordSet: false, // Legacy field for compatibility
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userRef = doc(db, 'users', employeeId);
      await updateDoc(userRef, userData);

      return {
        success: true,
        message: 'Temporary user created successfully',
        user: userData
      };
    } catch (error) {
      console.error('Error creating temporary user:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  createTemporaryUserByEmail: async (email: string, name: string, role: string) => {
    console.warn('createTemporaryUserByEmail is deprecated - use createTemporaryUser with employee ID instead');
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // This would typically be handled by Firebase Auth
      // For now, just return a mock response
      return {
        success: true,
        message: 'Temporary user creation would be handled by Firebase Auth (deprecated)'
      };
    } catch (error) {
      console.error('Error creating temporary user:', error);
      throw error;
    }
  }
};

export default adminUserService;
