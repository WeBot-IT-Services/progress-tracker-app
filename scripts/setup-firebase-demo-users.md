# Firebase Demo Users Setup Guide

## Overview
This guide explains how to create demo users in Firebase Authentication for the Quick Demo Access functionality in the Progress Tracker app.

## Required Demo Users

The following demo users must be created in Firebase Authentication:

### 1. Admin Demo User
- **Employee ID**: A0001
- **Email**: admin@mysteel.com
- **Password**: WR2024
- **Role**: admin
- **Department**: Administration

### 2. Sales Demo User
- **Employee ID**: S0001
- **Email**: sales@mysteel.com
- **Password**: WR2024
- **Role**: sales
- **Department**: Sales

### 3. Design Demo User
- **Employee ID**: D0001
- **Email**: design@mysteel.com
- **Password**: WR2024
- **Role**: designer
- **Department**: Design

### 4. Production Demo User
- **Employee ID**: P0001
- **Email**: production@mysteel.com
- **Password**: WR2024
- **Role**: production
- **Department**: Production

### 5. Installation Demo User
- **Employee ID**: I0001
- **Email**: installation@mysteel.com
- **Password**: WR2024
- **Role**: installation
- **Department**: Installation

## Setup Instructions

### Step 1: Firebase Authentication Setup
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `mysteelprojecttracker`
3. Navigate to Authentication > Users
4. Click "Add user" for each demo user

### Step 2: Create Users in Firebase Auth
For each demo user:
1. Click "Add user"
2. Enter the email address (e.g., admin@mysteel.com)
3. Enter the password: WR2024
4. Click "Add user"

### Step 3: Create User Documents in Firestore
For each demo user, create a document in the `users` collection:

1. Go to Firestore Database
2. Navigate to the `users` collection
3. Create a document with the user's UID (from Authentication)
4. Add the following fields:

```json
{
  "email": "admin@mysteel.com",
  "employeeId": "A0001",
  "name": "Demo Administrator",
  "role": "admin",
  "department": "Administration",
  "status": "active",
  "passwordSet": true,
  "isTemporary": false,
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T00:00:00.000Z"
}
```

### Step 4: Verify Setup
1. Start the development server: `npm run dev`
2. Go to the login page
3. Click on any Quick Demo Access button
4. Verify successful login with appropriate role access

## Firestore User Document Template

Use this template for each demo user (replace values as needed):

```javascript
// Admin User (A0001)
{
  email: "admin@mysteel.com",
  employeeId: "A0001",
  name: "Demo Administrator",
  role: "admin",
  department: "Administration",
  status: "active",
  passwordSet: true,
  isTemporary: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Sales User (S0001)
{
  email: "sales@mysteel.com",
  employeeId: "S0001",
  name: "Demo Sales Manager",
  role: "sales",
  department: "Sales",
  status: "active",
  passwordSet: true,
  isTemporary: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Design User (D0001)
{
  email: "design@mysteel.com",
  employeeId: "D0001",
  name: "Demo Design Engineer",
  role: "designer",
  department: "Design",
  status: "active",
  passwordSet: true,
  isTemporary: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Production User (P0001)
{
  email: "production@mysteel.com",
  employeeId: "P0001",
  name: "Demo Production Manager",
  role: "production",
  department: "Production",
  status: "active",
  passwordSet: true,
  isTemporary: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Installation User (I0001)
{
  email: "installation@mysteel.com",
  employeeId: "I0001",
  name: "Demo Installation Manager",
  role: "installation",
  department: "Installation",
  status: "active",
  passwordSet: true,
  isTemporary: false,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## Security Notes

1. **Demo Password**: All demo users use the same password (WR2024) for simplicity
2. **Production Use**: These are for testing only - change passwords in production
3. **Firebase Rules**: Ensure Firestore security rules allow user document creation
4. **Employee ID Mapping**: The app uses employee IDs to look up email addresses in Firestore

## Troubleshooting

### Demo Login Fails
- Verify user exists in Firebase Authentication
- Check that user document exists in Firestore `users` collection
- Ensure employee ID matches exactly (case-sensitive)
- Verify password is set to "WR2024"

### Role Access Issues
- Check the `role` field in the Firestore user document
- Ensure role matches one of: admin, sales, designer, production, installation
- Verify user document structure matches the template

### Employee ID Not Found
- Ensure `employeeId` field exists in Firestore user document
- Check that employee ID format is correct (A0001, S0001, etc.)
- Verify the Enhanced Employee ID Auth Service can find the user

## Testing the Setup

After creating all demo users, test each one:

1. **Admin (A0001)**: Should have access to all modules including Admin Panel
2. **Sales (S0001)**: Should have edit access to Sales module
3. **Design (D0001)**: Should have edit access to Design & Engineering module
4. **Production (P0001)**: Should have edit access to Production module
5. **Installation (I0001)**: Should have edit access to Installation module

All users should be able to view other modules in read-only mode.
