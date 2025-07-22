
// Force Update Client Script
// Automatically checks for updates and forces refresh when needed

class ForceUpdateClient {
  constructor() {
    this.version = '3.15.0';
    this.buildId = 'd26bb59-1752827539573';
    this.buildTimestamp = 1752827539573;
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
      `A new version (${serverVersion.version}) is available.`;

    // For automatic updates, don't show confirmation dialog
    if (serverVersion.forceUpdate === true) {
      console.log('🔄 Performing automatic update...');
      this.performForceUpdate();
    } else {
      // Show confirmation dialog for manual updates
      if (confirm(`${updateMessage}\n\nClick OK to update now or Cancel to continue with the current version.`)) {
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
