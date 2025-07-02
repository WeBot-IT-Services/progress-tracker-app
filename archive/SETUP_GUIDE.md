# 🚀 Mysteel Progress Tracker - Database Setup Guide

This guide will help you set up test user accounts and sample data for all modules in the Mysteel Construction Progress Tracker application.

## 📋 Prerequisites

1. **Application Running**: Make sure the development server is running at `http://localhost:5173`
2. **Firebase Connected**: Verify Firebase configuration is working
3. **Browser Console Access**: You'll need to use browser developer tools

## 🎯 Quick Setup (Recommended)

### **Step 1: Open the Application**
1. Navigate to `http://localhost:5173` in your browser
2. You should see the login screen with demo access cards

### **Step 2: Open Browser Console**
1. Press **F12** (or right-click → Inspect)
2. Click on the **Console** tab
3. You should see: "🔧 Development Console Helpers Loaded!"

### **Step 3: Run Complete Setup**
In the console, execute:
```javascript
setupCompleteDatabase()
```

This single command will:
- ✅ Create all 5 test user accounts in Firebase Authentication
- ✅ Create user profile documents in Firestore
- ✅ Seed sample data for all 8 modules
- ✅ Display login credentials

### **Step 4: Verify Setup**
After completion, run:
```javascript
verifyDatabase()
```

## 🔐 Test Account Credentials

| **Role** | **Email** | **Password** | **Access Level** |
|----------|-----------|--------------|------------------|
| **Admin** | `admin@mysteel.com` | `admin123` | Full system control, all modules |
| **Sales** | `sales@mysteel.com` | `sales123` | Sales module + Dashboard |
| **Designer** | `designer@mysteel.com` | `designer123` | Design module + Dashboard |
| **Production** | `production@mysteel.com` | `production123` | Production module + Dashboard |
| **Installation** | `installation@mysteel.com` | `installation123` | Installation module + Dashboard |

## 📊 Sample Data Created

### **Projects (6 projects)**
- Mysteel Office Complex (Production, 65% progress, RM 2.5M)
- Industrial Warehouse Project (DNE, 25% progress, RM 1.8M)
- Residential Tower Development (Installation, 85% progress, RM 4.2M)
- Shopping Mall Renovation (Completed, 100% progress, RM 3.1M)
- School Building Construction (Production, 45% progress, RM 1.5M)
- Hospital Wing Extension (DNE, 15% progress, RM 2.8M)

### **Complaints (5 complaints)**
- Installation Delay Issue (High priority, Open)
- Material Quality Concern (Medium priority, In Progress)
- Communication Gap (Low priority, Resolved)
- Safety Protocol Violation (High priority, Open)
- Design Modification Request (Medium priority, In Progress)

### **Milestones (4 milestones per project)**
- Foundation Work, Steel Framework, Exterior Walls, Interior Finishing

### **Module-Specific Data**
- **Sales**: 2 proposals (negotiation, proposal status)
- **Design**: 2 design projects (completed, in-progress)
- **Production**: 2 production entries (fabrication, quality-control)
- **Installation**: 2 installation projects (structural, finishing)

## 🧪 Testing Checklist

### **✅ Authentication & Authorization**
1. **Login with each role** and verify access restrictions
2. **Admin** should see all 8 modules + amounts
3. **Other roles** should only see their specific module + Dashboard

### **✅ Module Functionality**
1. **Dashboard** - View statistics and charts
2. **Sales** - Create/edit sales proposals
3. **Design** - Update design status and approvals
4. **Production** - Manage production milestones
5. **Installation** - Upload photos and update progress
6. **Complaints** - Full CRUD operations
7. **Master Tracker** - Timeline visualization with filtering
8. **Admin** - User management and security testing

### **✅ Real-time Features**
1. Open **two browser windows**
2. Login with **different roles** in each
3. Make changes in one window
4. Verify updates appear in the other window

### **✅ Offline Functionality**
1. Disconnect internet
2. Make changes (should work offline)
3. Reconnect internet
4. Verify data syncs automatically

## 🔧 Manual Setup (Alternative)

If the one-click setup doesn't work, run these commands step by step:

```javascript
// Step 1: Create test users
createTestUsers()

// Step 2: Wait 2 seconds, then seed data
setTimeout(() => {
  seedData()
}, 2000)

// Step 3: Display credentials
showLoginCredentials()
```

## 🛠️ Available Console Commands

```javascript
// Setup & Verification
setupCompleteDatabase()    // Complete one-click setup
verifyDatabase()          // Check database status
showLoginCredentials()    // Display test account credentials

// Individual Operations
createTestUsers()         // Create test user accounts only
seedData()               // Seed sample data only
testAccounts            // View test account details

// Security Testing (Admin only)
testSecurity()           // Run security tests
checkPermissions()       // Verify role-based access
```

## 🚨 Troubleshooting

### **Console Commands Not Available**
- Refresh the page and try again
- Check for JavaScript errors in console
- Verify the application loaded completely

### **Firebase Connection Issues**
- Check Firebase configuration in `src/config/firebase.ts`
- Verify Firebase project is active
- Check network connectivity

### **Authentication Errors**
- Clear browser cache and cookies
- Check Firebase Authentication is enabled
- Verify email/password provider is configured

### **Data Not Appearing**
- Run `verifyDatabase()` to check data status
- Check Firestore security rules
- Verify user has proper permissions

## 📱 Mobile Testing

After setup, test on mobile devices:
1. **PWA Installation** - Add to home screen
2. **Offline Functionality** - Disconnect and test
3. **Touch Interface** - Verify all interactions work
4. **File Upload** - Test photo uploads from camera

## 🔒 Security Features

The setup includes:
- **Role-based access control** with field-level permissions
- **Firebase Security Rules** for data protection
- **Real-time validation** of user permissions
- **Audit logging** for sensitive operations

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase project configuration
3. Ensure all dependencies are installed
4. Contact the development team with specific error details

---

**🎉 Ready to Test!** Once setup is complete, you can thoroughly test all features with realistic data across all user roles.
