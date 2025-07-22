/**
 * Default Configuration Settings
 * 
 * Centralized configuration for default values used throughout the application
 */

export const DEFAULT_SETTINGS = {
  // User Management
  DEFAULT_PASSWORD: 'WR2024',
  PASSWORD_CHANGE_REQUIRED: true,
  
  // Demo Users
  DEMO_USERS: [
    { employeeId: 'A0001', name: 'Admin User', role: 'admin' as const },
    { employeeId: 'S0001', name: 'Sales Manager', role: 'sales' as const },
    { employeeId: 'D0001', name: 'Design Lead', role: 'designer' as const },
    { employeeId: 'P0001', name: 'Production Manager', role: 'production' as const },
    { employeeId: 'I0001', name: 'Installation Lead', role: 'installation' as const }
  ],
  
  // Application Settings
  APP_NAME: 'Progress Tracker',
  VERSION: '2.0.0',
  
  // PWA Settings
  UPDATE_CHECK_INTERVAL: 30000, // 30 seconds
  FORCE_UPDATE_ENABLED: true,
  
  // Authentication
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  AUTO_LOGOUT_WARNING: 5 * 60 * 1000, // 5 minutes warning before auto logout
  
  // Security
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // UI Settings
  ITEMS_PER_PAGE: 10,
  ANIMATION_DURATION: 300,
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
  
  // Notifications
  TOAST_DURATION: 5000, // 5 seconds
  ERROR_TOAST_DURATION: 8000, // 8 seconds
} as const;

/**
 * Environment-specific settings
 */
export const getEnvironmentSettings = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    apiUrl: isDevelopment ? 'http://localhost:3000' : 'https://your-production-url.com',
    enableDebugLogs: isDevelopment,
    enableServiceWorker: isProduction,
    enableAnalytics: isProduction,
  };
};

/**
 * Get default password for new users
 */
export const getDefaultPassword = (): string => {
  return DEFAULT_SETTINGS.DEFAULT_PASSWORD;
};

/**
 * Check if password change is required for new users
 */
export const isPasswordChangeRequired = (): boolean => {
  return DEFAULT_SETTINGS.PASSWORD_CHANGE_REQUIRED;
};

/**
 * Get demo user configuration
 */
export const getDemoUsers = () => {
  return DEFAULT_SETTINGS.DEMO_USERS;
};

/**
 * Get current app version
 */
export const getAppVersion = (): string => {
  return DEFAULT_SETTINGS.VERSION;
};
