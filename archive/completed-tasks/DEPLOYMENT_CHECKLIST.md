# Deployment Checklist - Version 3.13.0

## Pre-Deployment Steps

### 1. Version Update
- [ ] Update version in `package.json` to `3.13.0`
- [ ] Verify version in `public/manifest.json` matches
- [ ] Run `npm run prebuild` to update service worker version
- [ ] Check that `src/config/version.ts` exports correct version

### 2. Build Process
- [ ] Run `npm run build:deploy` (includes version update script)
- [ ] Verify build completes without errors
- [ ] Check that `dist/` folder contains updated files
- [ ] Verify service worker in `dist/sw.js` has correct version

### 3. Version Verification
- [ ] Check build output shows version `3.13.0`
- [ ] Verify cache names include build timestamp
- [ ] Test version display in development mode

## Deployment Steps

### 1. Deploy to Production
- [ ] Upload `dist/` contents to production server
- [ ] Ensure service worker is deployed to root path
- [ ] Verify manifest.json is accessible

### 2. Cache Management
- [ ] Clear CDN cache if using one
- [ ] Force refresh service worker registration
- [ ] Test that old caches are cleaned up

### 3. Post-Deployment Verification
- [ ] Open production app in incognito/private window
- [ ] Check version display shows `3.13.0`
- [ ] Verify service worker is active
- [ ] Test app functionality

## Troubleshooting Version Issues

### If Version Still Shows 3.1.0:

1. **Clear Browser Cache**
   ```bash
   # In browser dev tools:
   # Application > Storage > Clear storage
   ```

2. **Force Service Worker Update**
   ```javascript
   // In browser console:
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
     window.location.reload();
   });
   ```

3. **Check Cache Names**
   ```javascript
   // In browser console:
   caches.keys().then(names => console.log('Cache names:', names));
   ```

4. **Verify Build Process**
   ```bash
   # Check if version update script ran:
   grep "3.13.0" public/sw.js
   grep "3.13.0" public/manifest.json
   ```

### Common Issues:

- **Cached Service Worker**: Old SW prevents new version from loading
- **CDN Cache**: CDN serving old files
- **Browser Cache**: Hard refresh needed (Ctrl+Shift+R)
- **Build Script**: Version update script didn't run

## Version Display Locations

The version should appear in:
- [ ] Dashboard footer badge
- [ ] Browser dev tools (VersionChecker component in dev mode)
- [ ] Service worker cache names
- [ ] Manifest.json
- [ ] Console logs during app initialization

## Emergency Rollback

If issues occur:
1. Revert to previous version in package.json
2. Run build process again
3. Deploy previous working version
4. Clear all caches

## Success Criteria

✅ Version displays as `3.13.0` in production
✅ Service worker cache names include new build timestamp
✅ App functions correctly with new version
✅ No console errors related to version mismatch
✅ Seamless update mechanism working
