# 🔒 Firebase Security Rules Setup Guide

## 📋 Overview
This guide provides comprehensive Firebase Security Rules for the Mysteel Construction Progress Tracker app, ensuring role-based access control and data protection.

## 🚀 Quick Setup

### 1. Deploy Firestore Security Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Security Rules
```bash
# Deploy Storage rules
firebase deploy --only storage
```

### 3. Deploy All Rules
```bash
# Deploy both Firestore and Storage rules
firebase deploy --only firestore:rules,storage
```

## 🔐 Security Rules Overview

### Firestore Security Rules (`firestore.rules`)

#### **User Roles Supported:**
- `admin` - Full access to all data and operations
- `sales` - Can create/edit projects, view amounts
- `designer` - Can update DNE projects, upload design files
- `production` - Can manage milestones, update production status
- `installation` - Can update installation status, upload photos

#### **Collection Access Control:**

##### **Projects Collection:**
- **Read**: All authenticated users
- **Create**: Admin, Sales
- **Update**: Role-based status transitions
  - Sales: Own projects (DNE status only)
  - Designer: DNE → Production/Completed
  - Production: Production → Installation
  - Installation: Installation → Completed
- **Delete**: Admin, Sales (own projects)

##### **Complaints Collection:**
- **Read**: All authenticated users
- **Create**: All authenticated users
- **Update**: Admin, complaint creator
- **Delete**: Admin only

##### **Milestones Collection:**
- **Read**: All authenticated users
- **Create**: Admin, Production
- **Update**: Admin, Production, Installation (status only)
- **Delete**: Admin, Production

##### **Users Collection:**
- **Read**: Admin, own profile
- **Create**: Admin only
- **Update**: Admin, own profile (except role)
- **Delete**: Admin only

#### **Data Validation:**
- Required fields validation
- Data type checking
- Status transition validation
- Field-level security (amounts visible to Admin/Sales only)

### Storage Security Rules (`storage.rules`)

#### **File Upload Permissions:**

##### **Design Files (`/design/{projectId}/`):**
- **Upload**: Admin, Designer
- **View**: All authenticated users
- **Delete**: Admin, Designer
- **File Types**: Images, PDF, DWG, Documents
- **Size Limit**: 50MB

##### **Installation Photos (`/installation/{projectId}/`):**
- **Upload**: Admin, Installation
- **View**: All authenticated users
- **Delete**: Admin, Installation
- **File Types**: Images only
- **Size Limit**: 50MB

##### **User Avatars (`/avatars/{userId}`):**
- **Upload**: Admin, own avatar
- **View**: All authenticated users
- **Delete**: Admin, own avatar
- **File Types**: Images only
- **Size Limit**: 5MB

## 🧪 Testing Security Rules

### 1. Test Firestore Rules
```bash
# Install Firebase emulator
firebase setup:emulators:firestore

# Start emulator with rules
firebase emulators:start --only firestore

# Run tests (create test files)
npm run test:firestore
```

### 2. Test Storage Rules
```bash
# Start storage emulator
firebase emulators:start --only storage

# Test file uploads with different roles
npm run test:storage
```

### 3. Manual Testing Checklist

#### **Admin Role Testing:**
- ✅ Can read all projects including amounts
- ✅ Can create, update, delete any project
- ✅ Can manage all users
- ✅ Can upload files to any folder
- ✅ Can update any project status

#### **Sales Role Testing:**
- ✅ Can create new projects
- ✅ Can edit own projects (DNE status)
- ✅ Can view project amounts
- ❌ Cannot edit other users' projects
- ❌ Cannot access admin functions

#### **Designer Role Testing:**
- ✅ Can view DNE projects
- ✅ Can update DNE → Production/Completed
- ✅ Can upload design files
- ❌ Cannot view project amounts
- ❌ Cannot update non-DNE projects

#### **Production Role Testing:**
- ✅ Can view Production projects
- ✅ Can create/manage milestones
- ✅ Can update Production → Installation
- ❌ Cannot update DNE projects
- ❌ Cannot view project amounts

#### **Installation Role Testing:**
- ✅ Can view Installation projects
- ✅ Can upload installation photos
- ✅ Can update Installation → Completed
- ✅ Can update milestone status
- ❌ Cannot create milestones
- ❌ Cannot view project amounts

## 🚨 Security Best Practices

### 1. **Role Verification**
```javascript
// Always verify user role in frontend
const { currentUser } = useAuth();
if (currentUser?.role !== 'admin') {
  // Hide sensitive UI elements
}
```

### 2. **Amount Field Protection**
```javascript
// Only show amounts to authorized roles
{(currentUser?.role === 'admin' || currentUser?.role === 'sales') && (
  <span>RM {project.amount}</span>
)}
```

### 3. **Status Transition Validation**
```javascript
// Validate status transitions in frontend
const canUpdateStatus = (currentStatus, newStatus, userRole) => {
  // Implement business logic validation
};
```

### 4. **File Upload Validation**
```javascript
// Validate file types and sizes before upload
const validateFile = (file, allowedTypes, maxSize) => {
  return allowedTypes.includes(file.type) && file.size <= maxSize;
};
```

## 🔧 Production Deployment

### 1. **Environment Setup**
```bash
# Set production environment
firebase use production

# Deploy rules
firebase deploy --only firestore:rules,storage
```

### 2. **Monitoring**
- Enable Firebase Security Rules monitoring
- Set up alerts for rule violations
- Monitor file upload patterns
- Track authentication failures

### 3. **Backup Strategy**
- Regular Firestore exports
- Storage file backups
- Security rules version control

## 📊 Security Metrics

### **Key Metrics to Monitor:**
- Authentication success/failure rates
- Rule violation attempts
- File upload patterns
- Data access patterns by role
- Unauthorized access attempts

### **Alerts to Set Up:**
- Multiple failed authentication attempts
- Unauthorized data access attempts
- Large file uploads
- Unusual data modification patterns
- Security rule violations

## 🆘 Troubleshooting

### **Common Issues:**

#### **Permission Denied Errors:**
1. Check user authentication status
2. Verify user role in Firestore
3. Confirm rule syntax
4. Test with Firebase emulator

#### **File Upload Failures:**
1. Check file type and size limits
2. Verify user permissions
3. Confirm storage rules syntax
4. Test with different file types

#### **Status Update Failures:**
1. Verify status transition rules
2. Check user role permissions
3. Confirm project ownership
4. Test status flow logic

## 📝 Rule Updates

### **To Update Rules:**
1. Modify `firestore.rules` or `storage.rules`
2. Test with emulator
3. Deploy to staging environment
4. Test thoroughly
5. Deploy to production
6. Monitor for issues

### **Version Control:**
- Keep rules in version control
- Document all changes
- Test before deployment
- Maintain rollback capability
