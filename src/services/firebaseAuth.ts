// Firebase Authentication Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User as AppUser, UserRole } from '../types';

// Convert Firebase User to App User
const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<AppUser | null> => {
  if (!firebaseUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      // If user document doesn't exist, create a default one
      const defaultUser: Omit<AppUser, 'uid'> = {
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Unknown User',
        role: 'sales', // Default role
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...defaultUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        uid: firebaseUser.uid,
        ...defaultUser
      };
    }

    const userData = userDoc.data();
    return {
      uid: firebaseUser.uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error converting Firebase user:', error);
    return null;
  }
};

// Login with email and password
export const firebaseLogin = async (email: string, password: string): Promise<AppUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const appUser = await convertFirebaseUser(userCredential.user);
    
    if (!appUser) {
      throw new Error('Failed to load user data');
    }
    
    return appUser;
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('No account found with this email address');
      case 'auth/wrong-password':
        throw new Error('Incorrect password');
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled');
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later');
      default:
        throw new Error(error.message || 'Login failed');
    }
  }
};

// Register new user
export const firebaseRegister = async (
  email: string, 
  password: string, 
  name: string, 
  role: UserRole
): Promise<AppUser> => {
  try {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(userCredential.user, {
      displayName: name
    });

    // Create user document in Firestore
    const userData = {
      email,
      name,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    return {
      uid: userCredential.user.uid,
      email,
      name,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists');
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/weak-password':
        throw new Error('Password should be at least 6 characters');
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled');
      default:
        throw new Error(error.message || 'Registration failed');
    }
  }
};

// Logout
export const firebaseLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error('Logout failed');
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<AppUser>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Update Firebase Auth profile if name changed
    if (updates.name && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updates.name
      });
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error('Failed to update profile');
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: AppUser | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const appUser = await convertFirebaseUser(firebaseUser);
      callback(appUser);
    } else {
      callback(null);
    }
  });
};

// Get current user
export const getCurrentUser = async (): Promise<AppUser | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  return await convertFirebaseUser(firebaseUser);
};

// Check if user has specific role
export const hasRole = (user: AppUser | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

// Check if user can access specific module
export const canAccessModule = (user: AppUser | null, module: string): boolean => {
  // All authenticated users can access all modules (view-only for some)
  return user !== null;
};

// Check if user can see amount field
export const canSeeAmount = (user: AppUser | null): boolean => {
  return hasRole(user, ['admin', 'sales']);
};

// Check if user can edit project
export const canEditProject = (user: AppUser | null, projectCreatedBy?: string): boolean => {
  if (!user) return false;
  
  // Admin can edit all projects
  if (user.role === 'admin') return true;
  
  // Users can edit their own projects
  return user.uid === projectCreatedBy;
};

// Validate user role
export const isValidRole = (role: string): role is UserRole => {
  const validRoles: UserRole[] = ['admin', 'sales', 'designer', 'production', 'installation'];
  return validRoles.includes(role as UserRole);
};

// Create initial admin user (for setup)
export const createAdminUser = async (
  email: string, 
  password: string, 
  name: string
): Promise<AppUser> => {
  return await firebaseRegister(email, password, name, 'admin');
};

// Error handling utility
export const getAuthErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};
