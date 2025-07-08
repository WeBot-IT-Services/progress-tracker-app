# Force Update System for Firebase Hosting

This project implements a comprehensive force update system to ensure users always get the latest version of your application. The system uses multiple strategies to handle updates gracefully and efficiently.

## Features

- **Automatic Version Checking**: Periodically checks for new versions
- **Multiple Update Strategies**: Optional updates for minor changes, required updates for critical changes
- **Cache Busting**: Ensures fresh content delivery
- **Service Worker Integration**: Seamless background updates
- **User-Friendly UI**: Modern update notifications
- **Build ID Tracking**: Unique identifiers for each deployment

## How It Works

### 1. Build Process
- Each build generates a unique Build ID (git hash + timestamp)
- Service Worker cache names include the Build ID
- Assets are versioned with Build ID for cache busting
- Version metadata is embedded in the application

### 2. Client-Side Detection
- **Version Check Service**: Periodically fetches `/version.json` to check for updates
- **Multiple Triggers**: Checks on page focus, visibility change, and periodic intervals
- **Build ID Comparison**: Most reliable method for detecting changes

### 3. Update Strategies
- **Optional Updates**: User can dismiss and continue with current version
- **Required Updates**: Must update to continue using the app
- **Background Updates**: Service Worker prepares updates in background

### 4. Cache Management
- **Aggressive Cache Busting**: Clears all caches on update
- **Service Worker Cache**: Versioned cache names prevent stale content
- **Firebase Hosting Headers**: Configured for optimal caching

## Usage

### Quick Start
```bash
# Deploy with force update
npm run deploy

# Or use the enhanced deployment script
node scripts/deploy.js deploy
```

### Manual Commands
```bash
# Prepare force update configuration
npm run force-update

# Build with force update
npm run build:deploy

# Deploy with force update
npm run deploy:force
```

### Version Management
```bash
# Bump patch version and deploy
npm run version:bump

# Bump minor version and deploy
npm run version:bump:minor

# Bump major version and deploy
npm run version:bump:major
```

## Configuration

### Environment Variables
```bash
# Optional: Set your Firebase Hosting URL for deployment verification
FIREBASE_HOSTING_URL=https://your-app.web.app
```

### Firebase Hosting Headers
The system is configured with optimal caching headers in `firebase.json`:
- **HTML files**: No cache (always fresh)
- **JS/CSS files**: Long-term cache (1 year) with versioned filenames
- **Service Worker**: No cache (always fresh)
- **Version files**: No cache (always fresh)

## Files and Components

### Core Scripts
- `scripts/force-update-manager.js` - Main force update preparation
- `scripts/deploy.js` - Complete deployment with force update
- `scripts/update-sw-version.js` - Legacy service worker updater

### Client Components
- `src/services/versionCheckService.ts` - Version checking service
- `src/components/UpdateNotification.tsx` - Update notification UI
- `public/force-update-client.js` - Standalone update client

### Configuration Files
- `public/version.json` - Version metadata (generated)
- `public/sw.js` - Service worker with versioned caching
- `firebase.json` - Firebase hosting configuration
- `vite.config.ts` - Build configuration with version injection

## How Updates Are Delivered

### 1. Developer Deploys
```bash
npm run deploy
```

### 2. Build Process
- Generates unique Build ID
- Updates service worker with new cache names
- Creates `version.json` with metadata
- Builds app with versioned assets

### 3. User Experience
- App checks for updates periodically
- Shows notification when update available
- User can accept or dismiss (if optional)
- Update process is seamless and fast

### 4. Update Process
- Clears all caches
- Reloads with cache-busting parameters
- Service worker serves fresh content
- User sees updated app immediately

## Update Types

### Optional Updates
- Minor bug fixes
- UI improvements
- Non-breaking changes
- User can dismiss and continue

### Required Updates
- Security updates
- Breaking changes
- Critical bug fixes
- User must update to continue

## Monitoring and Debugging

### Development Mode
- Additional logging and debug information
- Version checker component for testing
- Manual update check button

### Production Mode
- Optimized update checks
- Minimal logging
- Automatic background updates

### Console Logging
```javascript
// Check current version
console.log('Version:', window.__APP_VERSION__);
console.log('Build ID:', window.__BUILD_ID__);

// Force manual update check
window.versionCheckService?.checkForUpdates();

// Force update immediately
window.versionCheckService?.forceUpdate();
```

## Troubleshooting

### Common Issues

1. **Updates Not Detected**
   - Check `version.json` is accessible
   - Verify Build ID is unique
   - Check browser network tab for 304 responses

2. **Cache Not Clearing**
   - Check service worker registration
   - Verify Firebase hosting headers
   - Clear browser cache manually

3. **Service Worker Issues**
   - Check service worker registration
   - Verify `sw.js` is accessible
   - Check console for service worker errors

### Force Manual Update
```javascript
// In browser console
await caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))));
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

## Best Practices

1. **Test Before Deployment**
   - Test update flow in development
   - Verify all features work after update
   - Test with different user roles

2. **Monitor Update Success**
   - Check analytics for update completion
   - Monitor error rates after deployment
   - Track user feedback

3. **Communication**
   - Use clear update messages
   - Provide release notes
   - Communicate breaking changes

## Security Considerations

- Version endpoint is publicly accessible (by design)
- No sensitive information in version metadata
- Updates are served over HTTPS
- Service worker follows same-origin policy

## Performance Impact

- Minimal: Version checks are lightweight
- Background updates don't block user interaction
- Cache management is optimized
- Build ID generation is fast

## Browser Support

- Modern browsers with Service Worker support
- Progressive enhancement for older browsers
- Fallback to manual refresh if needed

This force update system ensures your users always have the latest version while providing a smooth, user-friendly experience.
