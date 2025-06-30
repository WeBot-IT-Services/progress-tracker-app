// Local Authentication Service for Development
// This service provides authentication functionality when Firebase is not available

export interface LocalUser {
  uid: string;
  email: string;
  role: 'admin' | 'sales' | 'designer' | 'production' | 'installation';
  name: string;
  department?: string;
}

// Production credentials for local authentication
const LOCAL_USERS: Record<string, { password: string; user: LocalUser }> = {
  'admin@warehouseracking.my': {
    password: 'WR2024!Admin#Secure',
    user: {
      uid: 'local-admin-001',
      email: 'admin@warehouseracking.my',
      role: 'admin',
      name: 'Admin User',
      department: 'Administration'
    }
  },
  'sales@warehouseracking.my': {
    password: 'WR2024!Sales#Manager',
    user: {
      uid: 'local-sales-001',
      email: 'sales@warehouseracking.my',
      role: 'sales',
      name: 'Sales Manager',
      department: 'Sales'
    }
  },
  'design@warehouseracking.my': {
    password: 'WR2024!Design#Engineer',
    user: {
      uid: 'local-design-001',
      email: 'design@warehouseracking.my',
      role: 'designer',
      name: 'Design Engineer',
      department: 'Design'
    }
  },
  'production@warehouseracking.my': {
    password: 'WR2024!Prod#Manager',
    user: {
      uid: 'local-production-001',
      email: 'production@warehouseracking.my',
      role: 'production',
      name: 'Production Manager',
      department: 'Production'
    }
  },
  'installation@warehouseracking.my': {
    password: 'WR2024!Install#Super',
    user: {
      uid: 'local-installation-001',
      email: 'installation@warehouseracking.my',
      role: 'installation',
      name: 'Installation Supervisor',
      department: 'Installation'
    }
  }
};

export class LocalAuthService {
  private static instance: LocalAuthService;
  private currentUser: LocalUser | null = null;
  private listeners: Array<(user: LocalUser | null) => void> = [];

  private constructor() {
    // Check for existing session
    const savedUser = localStorage.getItem('localAuth_currentUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.warn('Failed to parse saved user:', error);
        localStorage.removeItem('localAuth_currentUser');
      }
    }
  }

  static getInstance(): LocalAuthService {
    if (!LocalAuthService.instance) {
      LocalAuthService.instance = new LocalAuthService();
    }
    return LocalAuthService.instance;
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<LocalUser> {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        const userRecord = LOCAL_USERS[email];
        
        if (!userRecord) {
          reject(new Error('User not found'));
          return;
        }

        if (userRecord.password !== password) {
          reject(new Error('Invalid password'));
          return;
        }

        this.currentUser = userRecord.user;
        localStorage.setItem('localAuth_currentUser', JSON.stringify(this.currentUser));
        
        // Notify listeners
        this.listeners.forEach(listener => listener(this.currentUser));
        
        console.log('🔐 Local authentication successful:', this.currentUser.email);
        resolve(this.currentUser);
      }, 500); // Simulate 500ms delay
    });
  }

  // Sign out
  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('localAuth_currentUser');
        
        // Notify listeners
        this.listeners.forEach(listener => listener(null));
        
        console.log('🔓 Local authentication signed out');
        resolve();
      }, 200);
    });
  }

  // Get current user
  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  // Add auth state listener
  onAuthStateChanged(callback: (user: LocalUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Get all available users (for development)
  getAvailableUsers(): Array<{ email: string; role: string; name: string }> {
    return Object.entries(LOCAL_USERS).map(([email, data]) => ({
      email,
      role: data.user.role,
      name: data.user.name
    }));
  }
}

// Export singleton instance
export const localAuth = LocalAuthService.getInstance();

// Development helper functions
if (typeof window !== 'undefined') {
  (window as any).localAuth = localAuth;
  (window as any).showLocalUsers = () => {
    console.table(localAuth.getAvailableUsers());
  };
}
