import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as AppUser, UserRole } from '../types';
import {
  firebaseRegister,
  firebaseLogout,
  onAuthStateChange,
  updateUserProfile as firebaseUpdateUserProfile,
  updateAuthPassword
} from '../services/firebaseAuth';
import {
  saveAuthData,
  getAuthData,
  clearAuthData,
  initOfflineStorage
} from '../services/offlineStorage';
import { initSyncService, setupRealtimeListeners, startSyncAfterAuth } from '../services/syncService';
import EnhancedEmployeeIdAuthService from '../services/enhancedEmployeeIdAuth';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<AppUser>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const login = async (identifier: string, password: string) => {
    console.log('🔐 Firebase authentication attempt started:', { identifier });

    try {
      // Use enhanced employee ID authentication service for Firebase authentication
      console.log('🔥 Attempting Firebase authentication...');
      const user = await EnhancedEmployeeIdAuthService.login(identifier, password);
      console.log('🔥 Firebase authentication successful');

      // Save user data to offline storage
      await saveAuthData(user);
      setCurrentUser(user);

      // Setup realtime listeners and start sync when user logs in
      if (user.uid) {
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

  const register = async (email: string, password: string, name: string, role: UserRole): Promise<AppUser> => {
    try {
      // Use Firebase registration
      const user = await firebaseRegister(email, password, name, role);

      // Save user data to offline storage
      await saveAuthData(user);
      setCurrentUser(user);

      // Setup realtime listeners and start sync when user registers
      if (user.uid) {
        try {
          startSyncAfterAuth();
          const unsubscribers = setupRealtimeListeners();
          setRealtimeUnsubscribers(unsubscribers);
        } catch (error) {
          console.warn('Failed to setup realtime listeners:', error);
        }
      }

      return user; // <-- return the created user
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

      // Use Firebase logout
      await firebaseLogout();

      // Clear offline storage
      await clearAuthData();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      // Update Firebase user profile
      await firebaseUpdateUserProfile(currentUser.uid, updates);

      const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };

      // Save updated user data to offline storage
      await saveAuthData(updatedUser);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // New: change password logic for first-login users
  const changePassword = async (newPassword: string) => {
    if (!currentUser) throw new Error('No user logged in');
    try {
      await updateAuthPassword(newPassword);
      // Mark password as set after successful update
      await updateUserProfile({ passwordSet: true, isTemporary: false });

      // Refresh user data to get updated flags
      console.log('🔄 Refreshing user data after password change...');
      await refreshUser();
      console.log('✅ User data refreshed after password change');
    } catch (error: any) {
      console.error('Change password error:', error);
      if (error.code === 'auth/requires-recent-login') {
        // Invalidate session and require re-login
        await logout();
        throw new Error('Session expired. Please log in again to change your password.');
      }
      throw error;
    }
  };

  // New: refresh user data from Firestore
  const refreshUser = async () => {
    if (!currentUser) return;
    
    try {
      const { getCurrentUser } = await import('../services/firebaseAuth');
      const freshUser = await getCurrentUser();
      if (freshUser) {
        await saveAuthData(freshUser);
        setCurrentUser(freshUser);
        console.log('🔄 User data refreshed from Firestore');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize offline storage
        await initOfflineStorage();

        // Initialize sync service (but don't start listeners yet)
        initSyncService();

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
    changePassword,
    refreshUser,
    isFirebaseMode: true,
    isLocalMode: false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export getCurrentUser function for services that need it
export const getCurrentUser = (): AppUser | null => {
  const authContext = React.useContext(AuthContext);
  return authContext ? authContext.currentUser : null;
};
