// Firebase Authentication Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
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
import { usersService } from './firebaseService';
import type { User as AppUser, UserRole } from '../types';

// Convert Firebase User to App User
const convertFirebaseUser = async (firebaseUser: FirebaseUser, forceRefresh = false): Promise<AppUser | null> => {
  if (!firebaseUser) return null;

  try {
    // Always fetch fresh data from Firestore to ensure we have the latest user flags
    let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    // If document doesn't exist with UID, try to find by email (fallback for different document structures)
    if (!userDoc.exists() && firebaseUser.email) {
      console.log(`🔍 User document not found with UID, searching by email: ${firebaseUser.email}`);

      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const usersRef = collection(db, 'users');
        const emailQuery = query(usersRef, where('email', '==', firebaseUser.email));
        const emailSnapshot = await getDocs(emailQuery);

        if (!emailSnapshot.empty) {
          userDoc = emailSnapshot.docs[0];
          console.log(`✅ Found user document by email: ${firebaseUser.email}`);

          // If found by email but stored with different ID, migrate to correct UID-based structure
          const userData = userDoc.data();
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...userData,
            uid: firebaseUser.uid, // Ensure UID is set
            updatedAt: serverTimestamp()
          });
          console.log(`🔄 Migrated user document to UID-based structure: ${firebaseUser.uid}`);

          // Re-fetch the document from the correct location
          userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        }
      } catch (error) {
        console.warn('Error searching for user by email:', error);
      }
    }

    if (!userDoc.exists()) {
      // If user document still doesn't exist, create a default one
      console.log(`🔧 Creating default user document for: ${firebaseUser.email}`);

      const defaultUser: Omit<AppUser, 'uid'> = {
        employeeId: `EMP${Date.now()}`, // Generate temporary employee ID
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Unknown User',
        role: 'sales', // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordSet: true,
        isTemporary: false
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...defaultUser,
        uid: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        uid: firebaseUser.uid,
        ...defaultUser
      };
    }

    const userData = userDoc.data();

    // Log the raw user data for debugging
    if (forceRefresh) {
      console.log('🔍 Raw Firestore user data:', {
        email: userData.email,
        passwordSet: userData.passwordSet,
        isTemporary: userData.isTemporary,
        passwordSetType: typeof userData.passwordSet,
        isTemporaryType: typeof userData.isTemporary
      });
    }

    // Check if this user needs flag updates (missing passwordSet or isTemporary flags)
    const needsUpdate = userData.passwordSet === undefined || userData.isTemporary === undefined;

    const userResult = {
      uid: firebaseUser.uid,
      email: userData.email,
      employeeId: userData.employeeId,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      // For existing users without explicit flags, assume password is set and not temporary
      passwordSet: userData.passwordSet ?? true,
      isTemporary: userData.isTemporary ?? false
    };

    // Log the final user result for debugging
    if (forceRefresh) {
      console.log('🔄 Final user result:', {
        email: userResult.email,
        passwordSet: userResult.passwordSet,
        isTemporary: userResult.isTemporary,
        needsUpdate: needsUpdate
      });
    }

    // Update the user document if it's missing the required flags
    if (needsUpdate && forceRefresh) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          passwordSet: userResult.passwordSet,
          isTemporary: userResult.isTemporary,
          updatedAt: serverTimestamp()
        });
        console.log('🔧 Updated user document with missing authentication flags');
      } catch (error) {
        console.warn('Failed to update user document:', error);
      }
    }
    
    // Log user flags for debugging
    if (forceRefresh) {
      console.log('🔄 User data refreshed from Firestore:', {
        uid: userResult.uid,
        email: userResult.email,
        passwordSet: userResult.passwordSet,
        isTemporary: userResult.isTemporary
      });
    }
    
    return userResult;
  } catch (error) {
    console.error('Error converting Firebase user:', error);
    return null;
  }
};

// Helper function to determine if identifier is email or employee ID
const isEmail = (identifier: string): boolean => {
  return identifier.includes('@');
};

// Login with email/employee ID and password
export const firebaseLogin = async (identifier: string, password: string): Promise<AppUser> => {
  try {
    let email = identifier;

    // If identifier is not an email, try to find user by employee ID
    if (!isEmail(identifier)) {
      try {
        const userByEmployeeId = await usersService.getUserByEmployeeId(identifier);
        if (userByEmployeeId) {
          email = userByEmployeeId.email;
        } else {
          throw new Error('No account found with this employee ID');
        }
      } catch (error) {
        throw new Error('No account found with this employee ID');
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const appUser = await convertFirebaseUser(userCredential.user, true); // Force refresh

    if (!appUser) {
      throw new Error('Failed to load user data');
    }

    return appUser;
  } catch (error: any) {
    console.error('Login error:', error);

    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error(isEmail(identifier) ? 'No account found with this email address' : 'No account found with this employee ID');
      case 'auth/wrong-password':
        throw new Error('Incorrect password');
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/invalid-credential':  // added
        throw new Error('Invalid email or password');
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
      employeeId: `EMP${Date.now()}`, // Generate temporary employee ID
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

// Add method to update authenticated user's password
export const updateAuthPassword = async (newPassword: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  // Refresh ID token to ensure credentials are up-to-date and avoid requires-recent-login errors
  await auth.currentUser.getIdToken(true);
  await updatePassword(auth.currentUser, newPassword);
};

// Auth state listener
export const onAuthStateChange = (callback: (user: AppUser | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const appUser = await convertFirebaseUser(firebaseUser, true); // Force refresh
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
  
  return await convertFirebaseUser(firebaseUser, true); // Force refresh
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
