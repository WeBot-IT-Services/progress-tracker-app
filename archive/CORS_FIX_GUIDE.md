# 🔧 Firebase CORS Issue - Fix Guide

The CORS error you're seeing is common when developing Firebase applications locally. Here are several solutions to fix this issue.

## 🚨 **Current Error**
```
Fetch API cannot load https://firestore.googleapis.com/... due to access control checks.
```

## 🛠️ **Solution 1: Browser CORS Bypass (Quickest)**

### **Option A: Chrome with CORS Disabled**
1. Close all Chrome windows
2. Open Chrome with CORS disabled:
   ```bash
   # Windows
   chrome.exe --user-data-dir=/tmp/chrome_dev_session --disable-web-security --disable-features=VizDisplayCompositor

   # Mac
   open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_session" --disable-web-security

   # Linux
   google-chrome --user-data-dir="/tmp/chrome_dev_session" --disable-web-security
   ```
3. Navigate to `http://localhost:5173`
4. Run the setup commands

### **Option B: Firefox with CORS Disabled**
1. Type `about:config` in Firefox address bar
2. Search for `security.fileuri.strict_origin_policy`
3. Set it to `false`
4. Restart Firefox and try again

## 🛠️ **Solution 2: Use Different Browser**

Try these browsers which often handle Firebase better in development:
- **Firefox Developer Edition**
- **Microsoft Edge**
- **Safari** (on Mac)

## 🛠️ **Solution 3: Alternative Setup Method**

I've created an alternative setup that works around CORS issues:

### **Step 1: Open Application**
Navigate to: `http://localhost:5173`

### **Step 2: Use Alternative Setup Commands**
Instead of `setupCompleteDatabase()`, try these individual commands:

```javascript
// Method 1: Step-by-step setup
createTestUsers()
  .then(() => {
    console.log('✅ Users created, waiting 3 seconds...');
    return new Promise(resolve => setTimeout(resolve, 3000));
  })
  .then(() => seedData())
  .then(() => {
    console.log('✅ Setup complete!');
    showLoginCredentials();
  })
  .catch(error => {
    console.error('❌ Setup failed:', error);
    console.log('💡 Try the manual method below...');
  });
```

### **Step 3: Manual Data Creation (If Above Fails)**
```javascript
// Manual user creation with error handling
async function manualSetup() {
  try {
    console.log('🔧 Starting manual setup...');
    
    // Create users one by one
    const users = [
      { email: 'admin@mysteel.com', password: 'admin123', name: 'Admin User', role: 'admin' },
      { email: 'sales@mysteel.com', password: 'sales123', name: 'Sales Manager', role: 'sales' },
      { email: 'designer@mysteel.com', password: 'designer123', name: 'Design Engineer', role: 'designer' },
      { email: 'production@mysteel.com', password: 'production123', name: 'Production Manager', role: 'production' },
      { email: 'installation@mysteel.com', password: 'installation123', name: 'Installation Supervisor', role: 'installation' }
    ];
    
    for (const user of users) {
      try {
        await createTestUser(user);
        console.log(`✅ Created: ${user.email}`);
      } catch (error) {
        console.log(`⚠️ ${user.email} might already exist`);
      }
    }
    
    console.log('🎉 Manual setup complete!');
    showLoginCredentials();
    
  } catch (error) {
    console.error('❌ Manual setup failed:', error);
  }
}

// Run manual setup
manualSetup();
```

## 🛠️ **Solution 4: Firebase Emulator (Recommended for Development)**

### **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

### **Initialize Firebase Emulator**
```bash
cd /workspaces/progress-tracker-app
firebase login
firebase init emulators
```

### **Start Emulators**
```bash
firebase emulators:start
```

### **Update Firebase Config for Emulator**
Add this to your console:
```javascript
// Connect to Firebase emulators
if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## 🛠️ **Solution 5: Network Configuration**

### **Check Network Settings**
```javascript
// Test Firebase connectivity
fetch('https://firestore.googleapis.com/')
  .then(response => console.log('✅ Firebase reachable'))
  .catch(error => console.log('❌ Firebase blocked:', error));
```

### **Try Different Network**
- Switch to mobile hotspot
- Use VPN
- Try different WiFi network

## 🛠️ **Solution 6: Environment Variables**

Create `.env.local` file:
```env
VITE_FIREBASE_API_KEY=AIzaSyB7wHIzsN4iBSPW4-G81DXtlaTowSsGg3Y
VITE_FIREBASE_AUTH_DOMAIN=mysteelprojecttracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mysteelprojecttracker
VITE_FIREBASE_STORAGE_BUCKET=mysteelprojecttracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=221205163780
VITE_FIREBASE_APP_ID=1:221205163780:web:52417a0db2f048ed962a51
```

## 🧪 **Test Account Credentials**

Once any solution works, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@mysteel.com` | `admin123` |
| **Sales** | `sales@mysteel.com` | `sales123` |
| **Designer** | `designer@mysteel.com` | `designer123` |
| **Production** | `production@mysteel.com` | `production123` |
| **Installation** | `installation@mysteel.com` | `installation123` |

## 🚨 **If All Solutions Fail**

### **Fallback: Use Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `mysteelprojecttracker`
3. Go to Authentication → Users
4. Manually create the test users
5. Go to Firestore Database
6. Manually add sample data

### **Contact Support**
If none of these solutions work:
1. Check browser console for specific error details
2. Try incognito/private browsing mode
3. Clear browser cache and cookies
4. Restart your computer and try again

## 🎯 **Recommended Quick Fix**

**Try this first:**
1. Open Chrome with CORS disabled (Solution 1A)
2. Navigate to `http://localhost:5173`
3. Run: `setupCompleteDatabase()`
4. If it works, you're done!

**If that doesn't work:**
1. Try Firefox (Solution 2)
2. Use the manual setup method (Solution 3)
3. Consider Firebase emulators (Solution 4)

---

**🔥 The goal is to get the test data created so you can properly test all the application features!**
