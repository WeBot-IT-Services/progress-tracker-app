# Firebase Hosting Deployment Guide

## 🚀 Live Application
**Production URL**: https://mysteelprojecttracker.web.app

## 📋 Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Authentication** with Firebase:
   ```bash
   firebase login
   ```

3. **Project Setup** (already configured):
   - Project ID: `mysteelprojecttracker`
   - Hosting configured for PWA support

## 🔧 Deployment Commands

### Quick Deploy
```bash
npm run deploy
```
This will:
1. Update service worker version
2. Build the application
3. Deploy to Firebase hosting

### Force Deploy (if needed)
```bash
npm run deploy:force
```
Use this if you encounter caching issues.

### Manual Deploy Steps
```bash
# 1. Build the application
npm run build:deploy

# 2. Deploy to Firebase
firebase deploy --only hosting
```

## 🔄 Force PWA Update

The application now includes force update functionality:

### For Users:
1. **Automatic Updates**: The app will check for updates automatically
2. **Manual Update**: Click the "Force Update" button in the update notification
3. **Clear Cache**: Use browser dev tools or the version checker component

### For Developers:
```javascript
// Force update via console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  window.location.reload();
});
```

## 📱 PWA Features

### Service Worker
- **Cache Strategy**: Cache-first for static assets
- **Version Management**: Automatic cache invalidation on updates
- **Offline Support**: Basic offline functionality

### Manifest
- **App Name**: Mysteel Progress Tracker
- **Icons**: Multiple sizes (120px, 152px, 180px, 192px, 512px)
- **Display**: Standalone mode
- **Theme**: Blue color scheme

## 🔍 Version Management

### Current Version: 3.13.0

The version is automatically managed through:
1. **package.json**: Source of truth for version
2. **Service Worker**: Auto-updated during build
3. **Manifest**: Synced with package version
4. **App Display**: Shows in footer and debug tools

### Version Update Process:
1. Update version in `package.json`
2. Run `npm run deploy`
3. Version is automatically propagated to all files

## 🛠️ Troubleshooting

### Version Not Updating
1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
2. **Force Service Worker Update**: Use force update button
3. **Check Build Output**: Verify version in built files

### Deployment Issues
```bash
# Re-authenticate if needed
firebase login --reauth

# Check project status
firebase projects:list

# Verify hosting configuration
firebase hosting:sites:list
```

### Cache Issues
```bash
# Clear all caches
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
);
```

## 📊 Monitoring

### Firebase Console
- **Project Console**: https://console.firebase.google.com/project/mysteelprojecttracker/overview
- **Hosting Dashboard**: Monitor deployments and usage
- **Performance**: Track app performance metrics

### Version Verification
1. Open app in incognito mode
2. Check footer for version badge
3. Use browser dev tools to verify service worker
4. Check cache names for build timestamp

## 🔐 Security

### Headers Configuration
- **Cache Control**: Optimized for static assets
- **Service Worker**: Proper scope configuration
- **Manifest**: No cache for dynamic updates

### Best Practices
1. Always test in incognito mode after deployment
2. Verify PWA installation works correctly
3. Test offline functionality
4. Check update mechanism works

## 📈 Performance

### Optimization Features
- **Asset Caching**: Long-term caching for static files
- **Service Worker**: Efficient cache management
- **Build Optimization**: Minified and compressed assets
- **CDN**: Firebase hosting global CDN

### Monitoring
- Use Firebase Performance Monitoring
- Check Core Web Vitals
- Monitor PWA installation rates

## 🚨 Emergency Procedures

### Rollback
If issues occur after deployment:
1. Revert version in package.json
2. Run `npm run deploy:force`
3. Clear all user caches

### Force Update All Users
1. Update version number
2. Deploy with force update enabled
3. Monitor for user complaints
4. Provide manual refresh instructions

## 📝 Deployment Checklist

- [ ] Version updated in package.json
- [ ] Build completes without errors
- [ ] Service worker version matches
- [ ] PWA manifest is valid
- [ ] Test in incognito mode
- [ ] Verify force update works
- [ ] Check offline functionality
- [ ] Monitor Firebase console for errors
