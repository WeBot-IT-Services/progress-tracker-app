// Admin User Service
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { User } from '../types';

export const adminUserService = {
  // Check if user exists and password status
  checkPasswordStatus: async (email: string) => {
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

      const needsPassword = !userData.passwordSet || userData.isTemporary;

      return {
        exists: true,
        needsPassword,
        isTemporary: userData.isTemporary || false,
        passwordSet: userData.passwordSet || false,
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

  // Update user password status
  updatePasswordStatus: async (userId: string, passwordSet: boolean = true, isTemporary: boolean = false) => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        passwordSet,
        isTemporary,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating password status:', error);
      throw error;
    }
  },

  // Get user by email
  getUserByEmail: async (email: string) => {
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

  // Create temporary user (admin function)
  createTemporaryUser: async (email: string, name: string, role: string) => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // This would typically be handled by Firebase Auth
      // For now, just return a mock response
      return {
        success: true,
        message: 'Temporary user creation would be handled by Firebase Auth'
      };
    } catch (error) {
      console.error('Error creating temporary user:', error);
      throw error;
    }
  }
};

export default adminUserService;
