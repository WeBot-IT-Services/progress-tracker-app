import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as AppUser, UserRole } from '../types';
import { mockLogin, mockRegister } from '../services/mockAuth';
import {
  firebaseLogin,
  firebaseRegister,
  firebaseLogout,
  onAuthStateChange,
  updateUserProfile as firebaseUpdateUserProfile
} from '../services/firebaseAuth';
import {
  saveAuthData,
  getAuthData,
  clearAuthData,
  initOfflineStorage
} from '../services/offlineStorage';
import { initSyncService, setupRealtimeListeners, startSyncAfterAuth } from '../services/syncService';
import { localAuth, type LocalUser } from '../services/localAuth';

// Configuration: set to true to use Firebase, false for mock auth
const USE_FIREBASE = true; // Always use Firebase now
const USE_LOCAL_FALLBACK = true; // Use local auth as fallback when Firebase fails

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  isFirebaseMode: boolean;
  isLocalMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeUnsubscribers, setRealtimeUnsubscribers] = useState<(() => void)[]>([]);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Helper function to convert LocalUser to AppUser
  const convertLocalUserToAppUser = (localUser: LocalUser): AppUser => ({
    uid: localUser.uid,
    email: localUser.email,
    name: localUser.name,
    role: localUser.role,
    department: localUser.department,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active'
  });

  const login = async (email: string, password: string) => {
    try {
      let user: AppUser;

      if (USE_FIREBASE && !isLocalMode) {
        try {
          user = await firebaseLogin(email, password);
          console.log('🔥 Firebase authentication successful');
        } catch (firebaseError) {
          console.warn('🔥 Firebase authentication failed:', firebaseError);

          if (USE_LOCAL_FALLBACK) {
            console.log('🔄 Falling back to local authentication...');
            const localUser = await localAuth.signIn(email, password);
            user = convertLocalUserToAppUser(localUser);
            setIsLocalMode(true);
            console.log('🔐 Local authentication successful');
          } else {
            throw firebaseError;
          }
        }
      } else if (isLocalMode || !USE_FIREBASE) {
        if (isLocalMode) {
          const localUser = await localAuth.signIn(email, password);
          user = convertLocalUserToAppUser(localUser);
        } else {
          user = await mockLogin(email, password);
        }
      } else {
        user = await mockLogin(email, password);
      }

      // Save user data to offline storage
      await saveAuthData(user);
      setCurrentUser(user);

      // Setup realtime listeners and start sync when user logs in (only if Firebase mode)
      if (USE_FIREBASE && !isLocalMode && user.uid) {
        try {
          startSyncAfterAuth();
          const unsubscribers = setupRealtimeListeners();
          setRealtimeUnsubscribers(unsubscribers);
        } catch (error) {
          console.warn('Failed to setup realtime listeners:', error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      let user: AppUser;

      if (USE_FIREBASE) {
        user = await firebaseRegister(email, password, name, role);
      } else {
        user = await mockRegister(email, password, name, role);
      }

      // Save user data to offline storage
      await saveAuthData(user);
      setCurrentUser(user);

      // Setup realtime listeners and start sync when user registers (only if authenticated)
      if (USE_FIREBASE && user.uid) {
        try {
          startSyncAfterAuth();
          const unsubscribers = setupRealtimeListeners();
          setRealtimeUnsubscribers(unsubscribers);
        } catch (error) {
          console.warn('Failed to setup realtime listeners:', error);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Cleanup realtime listeners
      realtimeUnsubscribers.forEach(unsubscribe => unsubscribe());
      setRealtimeUnsubscribers([]);

      if (isLocalMode) {
        await localAuth.signOut();
      } else if (USE_FIREBASE) {
        await firebaseLogout();
      }

      // Clear offline storage
      await clearAuthData();
      setCurrentUser(null);
      setIsLocalMode(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      if (USE_FIREBASE) {
        await firebaseUpdateUserProfile(currentUser.uid, updates);
      }

      const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };

      // Save updated user data to offline storage
      await saveAuthData(updatedUser);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize offline storage
        await initOfflineStorage();

        // Initialize sync service (but don't start listeners yet)
        initSyncService();

        if (USE_FIREBASE) {
          // Set up Firebase auth state listener
          const unsubscribe = onAuthStateChange(async (user) => {
            if (user) {
              await saveAuthData(user);
              setCurrentUser(user);

              // Setup realtime listeners and start sync (only if user is authenticated)
              try {
                startSyncAfterAuth();
                const unsubscribers = setupRealtimeListeners();
                setRealtimeUnsubscribers(unsubscribers);
              } catch (error) {
                console.warn('Failed to setup realtime listeners:', error);
              }
            } else {
              // Check for offline auth data
              const offlineUser = await getAuthData();
              setCurrentUser(offlineUser);
            }
            setLoading(false);
          });

          return unsubscribe;
        } else {
          // For mock mode, check for offline auth data
          const offlineUser = await getAuthData();
          setCurrentUser(offlineUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    isFirebaseMode: USE_FIREBASE && !isLocalMode,
    isLocalMode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
