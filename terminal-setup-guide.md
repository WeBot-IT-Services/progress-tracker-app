# 🚀 Terminal-Based Database Setup Guide

## **Quick Setup Using Browser Console (Recommended)**

Since the Firebase security rules are strict and require specific field validation, the easiest way to set up the database is through the browser console where the existing utilities handle all the validation correctly.

### **Step 1: Start the Application**
```bash
cd /workspaces/progress-tracker-app
npm run dev
```

### **Step 2: Open Browser and Console**
1. Open http://localhost:5173 in your browser
2. Press F12 to open Developer Tools
3. Go to the Console tab

### **Step 3: Execute Setup Commands**
Copy and paste these commands one by one:

```javascript
// 1. Create all test users and sample data
setupCompleteDatabase()

// 2. Verify the setup worked
verifyDatabase()

// 3. Show login credentials
showLoginCredentials()

// 4. Enable testing mode (access all modules)
enableTestingMode()
```

### **Step 4: Test the Application**
1. Login with any of these accounts:
   - **Admin**: `admin@mysteel.com` / `admin123`
   - **Sales**: `sales@mysteel.com` / `sales123`
   - **Designer**: `designer@mysteel.com` / `designer123`
   - **Production**: `production@mysteel.com` / `production123`
   - **Installation**: `installation@mysteel.com` / `installation123`

2. Test each module to ensure functionality works

---

## **Alternative: Manual Terminal Setup (Advanced)**

If you prefer to use terminal commands, here's how to set up Firebase authentication:

### **Option A: Firebase CLI Authentication**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set the project
firebase use mysteelprojecttracker

# Now try the Node.js script
npm run setup:direct
```

### **Option B: Service Account Key**
```bash
# Set environment variable with service account key
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Run the setup script
npm run setup:direct
```

---

## **Verification Commands**

### **Check if setup worked:**
```bash
# Verify data was created
npm run setup:client-verify
```

### **Browser console verification:**
```javascript
// Check users
firebase.firestore().collection('users').get().then(snapshot => {
  console.log(`Users: ${snapshot.size} documents`);
});

// Check projects
firebase.firestore().collection('projects').get().then(snapshot => {
  console.log(`Projects: ${snapshot.size} documents`);
});

// Check complaints
firebase.firestore().collection('complaints').get().then(snapshot => {
  console.log(`Complaints: ${snapshot.size} documents`);
});
```

---

## **Troubleshooting**

### **If browser console commands don't work:**
1. Refresh the page and try again
2. Make sure you're on http://localhost:5173
3. Check that the development server is running

### **If Firebase authentication fails:**
1. Check your internet connection
2. Verify Firebase project is accessible
3. Try the browser-based setup instead

### **If permission errors occur:**
1. The Firebase security rules are strict
2. Use the browser console setup which handles validation
3. Don't modify the security rules unless necessary

---

## **What Gets Created**

### **Test Users (5 accounts):**
- Admin User (full access)
- Sales Manager (sales + shared modules)
- Design Engineer (design + shared modules)
- Production Manager (production + shared modules)
- Installation Supervisor (installation + shared modules)

### **Sample Projects (5-6 projects):**
- Various statuses: DNE, Production, Installation, Completed
- Different priorities and amounts
- Realistic completion dates

### **Sample Complaints (3-4 complaints):**
- Different priorities and statuses
- Assigned to various team members
- Realistic scenarios

### **Sample Milestones:**
- Production milestones for projects
- Various completion statuses
- Realistic timelines

---

## **Next Steps After Setup**

1. **Test Role-Based Access:**
   - Login with different accounts
   - Verify each role sees appropriate modules
   - Test that restrictions work properly

2. **Test Core Functionality:**
   - Create new projects (Sales/Admin)
   - Update project status (Designer/Production/Installation)
   - Submit complaints (All roles)
   - Upload files (Designer/Installation)

3. **Test Mobile Experience:**
   - Open on mobile device or use browser dev tools
   - Verify responsive design works
   - Test touch interactions

4. **Performance Testing:**
   - Check page load times
   - Test with multiple users
   - Verify real-time updates

---

## **Production Deployment**

Once testing is complete:

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# Test production deployment
# Visit your Firebase hosting URL
```

---

## **Support**

If you encounter any issues:

1. **Check the console for errors**
2. **Verify internet connection**
3. **Try the browser-based setup first**
4. **Ensure development server is running**

**The browser console setup is the most reliable method and handles all Firebase security rule validation automatically.**
