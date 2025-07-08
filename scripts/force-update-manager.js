#!/usr/bin/env node

/**
 * Enhanced Force Update Manager
 * Implements multiple strategies for ensuring users get the latest version
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

class ForceUpdateManager {
  constructor() {
    this.packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    this.version = this.packageJson.version;
    this.buildTimestamp = Date.now();
    this.buildId = this.generateBuildId();
    
    console.log(`🚀 Force Update Manager v${this.version}`);
    console.log(`📅 Build ID: ${this.buildId}`);
    console.log(`⏰ Build Timestamp: ${this.buildTimestamp}`);
  }

  generateBuildId() {
    // Generate a unique build ID based on git commit (if available) + timestamp
    try {
      const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      return `${gitHash}-${this.buildTimestamp}`;
    } catch (error) {
      return `build-${this.buildTimestamp}`;
    }
  }

  async updateServiceWorker() {
    console.log('🔧 Updating Service Worker for force update...');
    
    const swPath = join('public', 'sw.js');
    let swContent = readFileSync(swPath, 'utf8');

    // Update version, build timestamp, and build ID
    swContent = swContent.replace(
      /const VERSION = '[^']*';/,
      `const VERSION = '${this.version}';`
    );

    swContent = swContent.replace(
      /const BUILD_TIMESTAMP = \d+;/,
      `const BUILD_TIMESTAMP = ${this.buildTimestamp};`
    );

    // Add build ID constant if not present
    if (!swContent.includes('const BUILD_ID =')) {
      swContent = swContent.replace(
        /const BUILD_TIMESTAMP = \d+;/,
        `const BUILD_TIMESTAMP = ${this.buildTimestamp};\nconst BUILD_ID = '${this.buildId}';`
      );
    } else {
      swContent = swContent.replace(
        /const BUILD_ID = '[^']*';/,
        `const BUILD_ID = '${this.buildId}';`
      );
    }

    // Update cache names - ensure BUILD_ID is defined first
    swContent = swContent.replace(
      /const CACHE_NAME = `progress-tracker-v\${VERSION}[^`]*`;/,
      `const CACHE_NAME = \`progress-tracker-v\${VERSION}-\${BUILD_ID}\`;`
    );

    swContent = swContent.replace(
      /const STATIC_CACHE_NAME = `progress-tracker-static-v\${VERSION}[^`]*`;/,
      `const STATIC_CACHE_NAME = \`progress-tracker-static-v\${VERSION}-\${BUILD_ID}\`;`
    );

    swContent = swContent.replace(
      /const DYNAMIC_CACHE_NAME = `progress-tracker-dynamic-v\${VERSION}[^`]*`;/,
      `const DYNAMIC_CACHE_NAME = \`progress-tracker-dynamic-v\${VERSION}-\${BUILD_ID}\`;`
    );

    writeFileSync(swPath, swContent);
    console.log('✅ Service Worker updated with force update configuration');
  }

  async updateManifest() {
    console.log('🔧 Updating PWA Manifest for force update...');
    
    const manifestPath = join('public', 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    
    manifest.version = this.version;
    manifest.build_id = this.buildId;
    manifest.build_timestamp = this.buildTimestamp;
    
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ PWA Manifest updated with force update configuration');
  }

  async updateIndexHtml() {
    console.log('🔧 Updating index.html for force update...');
    
    const indexPath = join('index.html');
    let indexContent = readFileSync(indexPath, 'utf8');

    // Add/update meta tags for cache busting
    const metaTags = `
    <!-- Force Update Meta Tags -->
    <meta name="app-version" content="${this.version}" />
    <meta name="build-id" content="${this.buildId}" />
    <meta name="build-timestamp" content="${this.buildTimestamp}" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />`;

    // Remove existing force update meta tags
    indexContent = indexContent.replace(
      /<!-- Force Update Meta Tags -->[\s\S]*?<meta http-equiv="Expires" content="0" \/>/,
      ''
    );

    // Add new meta tags before closing head tag
    indexContent = indexContent.replace(
      /<title>([^<]*)<\/title>/,
      `<title>$1</title>${metaTags}`
    );

    writeFileSync(indexPath, indexContent);
    console.log('✅ index.html updated with force update meta tags');
  }

  async createVersionFile() {
    console.log('🔧 Creating version.json for client-side version checking...');
    
    const versionData = {
      version: this.version,
      buildId: this.buildId,
      buildTimestamp: this.buildTimestamp,
      buildDate: new Date().toISOString(),
      forceUpdate: false, // Set to true only when needed to prevent infinite loops
      minimumVersion: this.version, // Can be used for breaking changes
      updateMessage: `Version ${this.version} is now available with new features and improvements.`,
      updateUrl: 'https://your-app-domain.com'
    };

    const versionPath = join('public', 'version.json');
    writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
    console.log('✅ version.json created for client-side version checking');
  }

  async createForceUpdateScript() {
    console.log('🔧 Creating force-update client script...');
    
    const scriptContent = `
// Force Update Client Script
// Automatically checks for updates and forces refresh when needed

class ForceUpdateClient {
  constructor() {
    this.version = '${this.version}';
    this.buildId = '${this.buildId}';
    this.buildTimestamp = ${this.buildTimestamp};
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.lastUpdateCheck = 0;
    this.updateInProgress = false;
    this.maxUpdateAttempts = 3;
    this.updateAttempts = 0;
    this.init();
  }

  init() {
    console.log('🔄 Force Update Client initialized');

    // Check if we just performed an update (prevent infinite loops)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('force-update')) {
      console.log('🔄 Update completed, removing force-update parameter');
      // Remove the force-update parameter from URL
      urlParams.delete('force-update');
      urlParams.delete('v');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);

      // Don't start version checking immediately after an update
      this.updateInProgress = false;
      this.updateAttempts = 0;

      // Wait longer before starting checks after an update
      setTimeout(() => {
        this.startVersionCheck();
        this.registerVisibilityListener();
      }, 30000); // Wait 30 seconds after update
      return;
    }

    this.startVersionCheck();
    this.registerVisibilityListener();
  }

  startVersionCheck() {
    setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);

    // Check immediately
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000); // Wait 10 seconds after page load
  }

  registerVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Check for updates when user returns to tab
        this.checkForUpdates();
      }
    });
  }

  async checkForUpdates() {
    // Prevent multiple simultaneous update checks
    if (this.updateInProgress) {
      console.log('🔄 Update already in progress, skipping check');
      return;
    }

    // Prevent too frequent checks
    const now = Date.now();
    if (now - this.lastUpdateCheck < 30000) { // Minimum 30 seconds between checks
      console.log('🔄 Update check too recent, skipping');
      return;
    }

    // Prevent infinite update attempts
    if (this.updateAttempts >= this.maxUpdateAttempts) {
      console.log('🔄 Maximum update attempts reached, stopping checks');
      return;
    }

    this.lastUpdateCheck = now;

    try {
      const response = await fetch('/version.json?t=' + Date.now(), {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch version info');
      }

      const serverVersion = await response.json();

      if (this.shouldForceUpdate(serverVersion)) {
        console.log('🚨 Force update required:', serverVersion);
        this.updateAttempts++;
        this.forceUpdate(serverVersion);
      } else {
        console.log('✅ No update needed, versions match');
      }
    } catch (error) {
      console.warn('⚠️ Failed to check for updates:', error);
    }
  }

  shouldForceUpdate(serverVersion) {
    console.log('🔍 Comparing versions:', {
      client: {
        version: this.version,
        buildId: this.buildId,
        buildTimestamp: this.buildTimestamp
      },
      server: {
        version: serverVersion.version,
        buildId: serverVersion.buildId,
        buildTimestamp: serverVersion.buildTimestamp
      }
    });

    // Check if build ID is different (most reliable)
    if (this.buildId !== serverVersion.buildId) {
      console.log('🔄 Build ID mismatch detected');
      return true;
    }

    // Check if version is different
    if (this.version !== serverVersion.version) {
      console.log('🔄 Version mismatch detected');
      return true;
    }

    // Check if build timestamp is newer (only if significantly newer to avoid minor differences)
    if (this.buildTimestamp < serverVersion.buildTimestamp - 60000) { // 1 minute threshold
      console.log('🔄 Newer build timestamp detected');
      return true;
    }

    return false;
  }

  forceUpdate(serverVersion) {
    // Prevent multiple update prompts
    if (this.updateInProgress) {
      console.log('🔄 Update already in progress, ignoring force update request');
      return;
    }

    this.updateInProgress = true;

    const updateMessage = serverVersion.updateMessage ||
      \`A new version (\${serverVersion.version}) is available.\`;

    // For automatic updates, don't show confirmation dialog
    if (serverVersion.forceUpdate === true) {
      console.log('🔄 Performing automatic update...');
      this.performForceUpdate();
    } else {
      // Show confirmation dialog for manual updates
      if (confirm(\`\${updateMessage}\\n\\nClick OK to update now or Cancel to continue with the current version.\`)) {
        this.performForceUpdate();
      } else {
        this.updateInProgress = false;
      }
    }
  }

  performForceUpdate() {
    console.log('🔄 Performing force update...');
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Clear storage
    localStorage.clear();
    sessionStorage.clear();

    // Force reload with cache busting
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    url.searchParams.set('force-update', 'true');
    window.location.replace(url.toString());
  }
}

// Initialize force update client
if (typeof window !== 'undefined') {
  window.forceUpdateClient = new ForceUpdateClient();
}
`;

    const scriptPath = join('public', 'force-update-client.js');
    writeFileSync(scriptPath, scriptContent);
    console.log('✅ Force update client script created');
  }

  async run() {
    console.log('🚀 Starting comprehensive force update preparation...');
    
    await this.updateServiceWorker();
    await this.updateManifest();
    await this.updateIndexHtml();
    await this.createVersionFile();
    await this.createForceUpdateScript();
    
    console.log('✅ Force update preparation complete!');
    console.log('📝 Summary:');
    console.log(`   - Version: ${this.version}`);
    console.log(`   - Build ID: ${this.buildId}`);
    console.log(`   - Build Timestamp: ${this.buildTimestamp}`);
    console.log(`   - Service Worker: Updated with new cache names`);
    console.log(`   - PWA Manifest: Updated with version info`);
    console.log(`   - Index.html: Updated with cache-busting meta tags`);
    console.log(`   - Version.json: Created for client-side checks`);
    console.log(`   - Force Update Client: Created for automatic updates`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new ForceUpdateManager();
  manager.run().catch(console.error);
}

export default ForceUpdateManager;
