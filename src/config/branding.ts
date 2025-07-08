/**
 * Branding Configuration
 * Central configuration for all branding elements
 */

// Company Information
export const COMPANY_INFO = {
  name: 'Mysteel Construction Management',
  shortName: 'Mysteel',
  tagline: 'Professional Project Management System',
  description: 'Secure Project Management System',
  website: 'https://mysteel.com',
  email: 'info@mysteel.com'
};

// Application Information
export const APP_INFO = {
  name: 'Progress Tracker',
  fullName: 'Mysteel Progress Tracker',
  description: 'Construction Management & Progress Tracking',
  shortDescription: 'Project Progress Tracking'
};

// Color Palette
export const BRAND_COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    900: '#0f172a'
  },
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed'
  }
};

// Logo Configuration
export const LOGO_CONFIG = {
  // Default logo path (will be updated when new logo is added)
  defaultLogo: '/mysteel-logo.png',
  favicon: '/mysteel-favicon.png',
  
  // PWA Icons
  icons: {
    '120': '/mysteel-icon-120.png',
    '152': '/mysteel-icon-152.png',
    '180': '/mysteel-icon-180.png',
    '192': '/mysteel-icon-192.png',
    '512': '/mysteel-icon-512.png'
  },
  
  // Logo variants for different use cases
  variants: {
    icon: 'icon-only',
    text: 'logo-with-text',
    full: 'full-branding',
    header: 'header-optimized',
    login: 'login-page'
  }
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  }
};

// Layout Configuration
export const LAYOUT_CONFIG = {
  maxWidth: '7xl',
  padding: {
    mobile: '1rem',
    tablet: '1.5rem',
    desktop: '2rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem'
  }
};
