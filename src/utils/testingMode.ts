// Testing Mode Utility
// Temporarily bypasses role-based access control for comprehensive testing

interface TestingModeConfig {
  enabled: boolean;
  bypassRoleRestrictions: boolean;
  showAllModules: boolean;
  allowAllRoutes: boolean;
}

class TestingModeManager {
  private config: TestingModeConfig = {
    enabled: false,
    bypassRoleRestrictions: false,
    showAllModules: false,
    allowAllRoutes: false
  };

  // Enable testing mode
  enableTestingMode(): void {
    this.config = {
      enabled: true,
      bypassRoleRestrictions: true,
      showAllModules: true,
      allowAllRoutes: true
    };
    
    console.log('🧪 TESTING MODE ENABLED');
    console.log('========================');
    console.log('• Role restrictions bypassed');
    console.log('• All modules visible in navigation');
    console.log('• All routes accessible');
    console.log('• This is for testing purposes only');
    console.log('');
    console.log('⚠️ Remember to disable testing mode after testing!');
    
    // Store in sessionStorage so it persists during testing session
    sessionStorage.setItem('testingMode', JSON.stringify(this.config));
  }

  // Disable testing mode
  disableTestingMode(): void {
    this.config = {
      enabled: false,
      bypassRoleRestrictions: false,
      showAllModules: false,
      allowAllRoutes: false
    };
    
    console.log('🔒 TESTING MODE DISABLED');
    console.log('========================');
    console.log('• Role restrictions restored');
    console.log('• Module visibility based on user role');
    console.log('• Route access controlled by permissions');
    
    // Remove from sessionStorage
    sessionStorage.removeItem('testingMode');
  }

  // Check if testing mode is enabled
  isEnabled(): boolean {
    // Check sessionStorage first
    const stored = sessionStorage.getItem('testingMode');
    if (stored) {
      try {
        this.config = JSON.parse(stored);
        return this.config.enabled;
      } catch (error) {
        console.warn('Invalid testing mode config in sessionStorage');
      }
    }
    return this.config.enabled;
  }

  // Check if role restrictions should be bypassed
  shouldBypassRoleRestrictions(): boolean {
    return this.isEnabled() && this.config.bypassRoleRestrictions;
  }

  // Check if all modules should be shown
  shouldShowAllModules(): boolean {
    return this.isEnabled() && this.config.showAllModules;
  }

  // Check if all routes should be allowed
  shouldAllowAllRoutes(): boolean {
    return this.isEnabled() && this.config.allowAllRoutes;
  }

  // Get current config
  getConfig(): TestingModeConfig {
    return { ...this.config };
  }

  // Toggle testing mode
  toggle(): void {
    if (this.isEnabled()) {
      this.disableTestingMode();
    } else {
      this.enableTestingMode();
    }
  }

  // Get all modules for testing (regardless of role)
  getAllModules() {
    return [
      {
        id: 'dashboard',
        title: 'Dashboard',
        subtitle: 'Overview & Statistics',
        path: '/',
        roles: ['admin', 'sales', 'designer', 'production', 'installation']
      },
      {
        id: 'sales',
        title: 'Sales',
        subtitle: 'Submit new projects',
        path: '/sales',
        roles: ['admin', 'sales']
      },
      {
        id: 'design',
        title: 'Design (DNE)',
        subtitle: 'Design & Engineering',
        path: '/design',
        roles: ['admin', 'designer']
      },
      {
        id: 'production',
        title: 'Production',
        subtitle: 'Manage production',
        path: '/production',
        roles: ['admin', 'production']
      },
      {
        id: 'installation',
        title: 'Installation',
        subtitle: 'Track installation',
        path: '/installation',
        roles: ['admin', 'installation']
      },
      {
        id: 'tracker',
        title: 'Master Tracker',
        subtitle: 'Project overview',
        path: '/tracker',
        roles: ['admin', 'sales', 'designer', 'production', 'installation']
      },
      {
        id: 'complaints',
        title: 'Complaints',
        subtitle: 'Submit complaints',
        path: '/complaints',
        roles: ['admin', 'sales', 'designer', 'production', 'installation']
      },
      {
        id: 'admin',
        title: 'Admin',
        subtitle: 'System administration',
        path: '/admin',
        roles: ['admin']
      }
    ];
  }
}

// Create singleton instance
export const testingMode = new TestingModeManager();

// Make available globally for console access
declare global {
  interface Window {
    enableTestingMode: () => void;
    disableTestingMode: () => void;
    toggleTestingMode: () => void;
    isTestingModeEnabled: () => boolean;
  }
}

// Auto-initialize in development
if (typeof window !== 'undefined') {
  window.enableTestingMode = () => testingMode.enableTestingMode();
  window.disableTestingMode = () => testingMode.disableTestingMode();
  window.toggleTestingMode = () => testingMode.toggle();
  window.isTestingModeEnabled = () => testingMode.isEnabled();
  
  console.log('🧪 Testing Mode Utilities Loaded!');
  console.log('=================================');
  console.log('Available commands:');
  console.log('• enableTestingMode() - Enable testing mode (bypass role restrictions)');
  console.log('• disableTestingMode() - Disable testing mode (restore restrictions)');
  console.log('• toggleTestingMode() - Toggle testing mode on/off');
  console.log('• isTestingModeEnabled() - Check if testing mode is active');
  console.log('');
  console.log('💡 Use enableTestingMode() to access all modules for testing');
}

export default testingMode;
