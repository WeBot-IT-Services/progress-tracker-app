import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as AppUser, UserRole } from '../types';
import { mockLogin, mockRegister } from '../services/mockAuth';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    try {
      // Use mock authentication for now
      const user = await mockLogin(email, password);
      setCurrentUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      // Use mock authentication for now
      const user = await mockRegister(email, password, name, role);
      setCurrentUser(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  useEffect(() => {
    // For mock mode, just set loading to false
    setLoading(false);
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
