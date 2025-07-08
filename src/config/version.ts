/**
 * Application Version Configuration
 * Single source of truth for version information
 */

// These are injected at build time by Vite
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIMESTAMP__: number;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.14.1';
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString();
export const BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : Date.now();

// Version display utilities
export const getVersionInfo = () => ({
  version: APP_VERSION,
  buildDate: BUILD_DATE,
  buildTimestamp: BUILD_TIMESTAMP,
  environment: import.meta.env.MODE || 'development'
});

export const getVersionString = () => `v${APP_VERSION}`;

export const getFullVersionString = () => {
  const env = import.meta.env.MODE || 'development';
  return `v${APP_VERSION} (${env})`;
};
