import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as AppUser, UserRole } from '../types';
import {
  saveAuthData,
  getAuthData,
  clearAuthData,
  initOfflineStorage
} from '../services/offlineStorage';
import { initSyncService, setupRealtimeListeners, startSyncAfterAuth } from '../services/syncService';
import EnhancedEmployeeIdAuthService from '../services/enhancedEmployeeIdAuth';
import { usersService } from '../services/firebaseService';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (employeeId: string, password: string) => Promise<void>;
  register: (employeeId: string, name: string, role: UserRole) => Promise<AppUser>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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

  const login = async (employeeId: string, password: string) => {
    console.log('🔐 Employee ID + Password authentication attempt started:', { employeeId });

    try {
      // Use enhanced employee ID authentication service with password
      console.log('🆔 Attempting Employee ID + Password authentication...');
      const user = await EnhancedEmployeeIdAuthService.login(employeeId, password);
      console.log('🆔 Employee ID + Password authentication successful');

      // Save user data to offline storage
      await saveAuthData(user);
      setCurrentUser(user);

      // Setup realtime listeners and start sync when user logs in
      if (user.employeeId) {
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

  const register = async (employeeId: string, name: string, role: UserRole): Promise<AppUser> => {
    try {
      // Create user with employee ID (no Firebase registration)
      const userData: Omit<AppUser, 'createdAt' | 'updatedAt'> = {
        employeeId,
        name,
        role,
        status: 'active',
        isTemporary: false,
        passwordSet: false
      };

      await usersService.createUser(userData);
      const user = await usersService.getUserByEmployeeId(employeeId);

      if (!user) {
        throw new Error('Failed to create user');
      }

      // Convert to AppUser type with required fields
      const appUser: AppUser = {
        ...user,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      };

      // Save user data to offline storage
      await saveAuthData(appUser);
      setCurrentUser(appUser);

      // Setup realtime listeners and start sync when user registers
      if (user.employeeId) {
        try {
          startSyncAfterAuth();
          const unsubscribers = setupRealtimeListeners();
          setRealtimeUnsubscribers(unsubscribers);
        } catch (error) {
          console.warn('Failed to setup realtime listeners:', error);
        }
      }

      return appUser;
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

      // Clear offline storage (no Firebase logout needed)
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
      // Update user profile using employee ID
      await usersService.updateUser(currentUser.employeeId, updates);

      const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };

      // Save updated user data to offline storage
      await saveAuthData(updatedUser);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Import password utilities
      const { verifyPassword } = await import('../utils/passwordUtils');

      // Verify current password
      if (currentUser.passwordHash) {
        const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.passwordHash);
        if (!isCurrentPasswordValid) {
          throw new Error('Current password is incorrect');
        }
      }

      // Update password
      await usersService.updateUserPassword(currentUser.employeeId, newPassword);

      console.log('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  // Refresh user data from Firestore using employee ID
  const refreshUser = async () => {
    if (!currentUser?.employeeId) {
      console.warn('No current user employee ID to refresh');
      return;
    }

    try {
      console.log('🔄 Refreshing user data from Firestore...');
      const freshUser = await usersService.getUser(currentUser.employeeId);
      if (freshUser) {
        // Convert to AppUser type with required fields
        const appUser: AppUser = {
          ...freshUser,
          createdAt: freshUser.createdAt || new Date(),
          updatedAt: freshUser.updatedAt || new Date()
        };

        await saveAuthData(appUser);
        setCurrentUser(appUser);
        console.log('✅ User data refreshed successfully');
      } else {
        console.warn('⚠️ User not found during refresh');
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      // Don't throw error to avoid breaking the UI
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize offline storage
        await initOfflineStorage();

        // Initialize sync service (but don't start listeners yet)
        initSyncService();

        // Check for offline auth data (no Firebase auth state listener)
        const offlineUser = await getAuthData();
        if (offlineUser) {
          setCurrentUser(offlineUser);

          // Setup realtime listeners and start sync if user is authenticated
          try {
            startSyncAfterAuth();
            const unsubscribers = setupRealtimeListeners();
            setRealtimeUnsubscribers(unsubscribers);
          } catch (error) {
            console.warn('Failed to setup realtime listeners:', error);
          }
        }

        setLoading(false);
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
    refreshUser,
    changePassword,
    isFirebaseMode: false, // No longer using Firebase Auth
    isLocalMode: true      // Using employee ID authentication
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
