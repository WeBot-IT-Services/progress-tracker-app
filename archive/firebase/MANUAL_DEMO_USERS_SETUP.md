# Manual Demo Users Setup Guide

## Issue
The demo users exist in Firebase Authentication but with unknown passwords, preventing the Quick Demo Access from working.

## Solution
We need to manually delete the existing users from Firebase Console and recreate them with the correct credentials.

## Step-by-Step Instructions

### Step 1: Delete Existing Demo Users
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mysteelprojecttracker**
3. Navigate to **Authentication** > **Users**
4. Find and delete these users (click the 3-dots menu > Delete user):
   - `admin@mysteel.com`
   - `sales@mysteel.com`
   - `design@mysteel.com`
   - `production@mysteel.com`
   - `installation@mysteel.com` (if it exists)

### Step 2: Clean Firestore Documents
1. Go to **Firestore Database**
2. Navigate to the `users` collection
3. Delete any documents that correspond to the demo users (look for documents with employeeId: A0001, S0001, D0001, P0001, I0001)

### Step 3: Recreate Demo Users
After deleting the existing users, run the setup script:

```bash
npm run setup:demo-users
```

This will create fresh demo users with the correct credentials.

### Step 4: Verify Setup
1. Start the development server: `npm run dev`
2. Go to the login page
3. Test each Quick Demo Access button:
   - 👑 Admin (A0001)
   - 💼 Sales (S0001)
   - 🎨 Design (D0001)
   - 🏭 Production (P0001)
   - 🔧 Installation (I0001)

## Expected Results

After successful setup, you should see:
- All 5 demo users created in Firebase Authentication
- Corresponding user documents in Firestore with correct employee IDs
- Quick Demo Access buttons working properly
- Each user logging in with appropriate role permissions

## Demo User Details

| Employee ID | Email | Password | Role | Department |
|-------------|-------|----------|------|------------|
| A0001 | admin@mysteel.com | WR2024 | admin | Administration |
| S0001 | sales@mysteel.com | WR2024 | sales | Sales |
| D0001 | design@mysteel.com | WR2024 | designer | Design |
| P0001 | production@mysteel.com | WR2024 | production | Production |
| I0001 | installation@mysteel.com | WR2024 | installation | Installation |

## Troubleshooting

### If Demo Login Still Fails
1. Check Firebase Console > Authentication to ensure users exist
2. Check Firestore > users collection for user documents
3. Verify employee IDs match exactly (case-sensitive)
4. Check browser console for detailed error messages

### If Users Already Exist Error
1. Go back to Step 1 and ensure all demo users are deleted
2. Wait a few minutes for Firebase to propagate the changes
3. Try the setup script again

### If Firestore Permission Errors
1. Check Firestore Security Rules
2. Ensure the rules allow user document creation
3. Verify the Firebase project configuration

## Alternative: Manual User Creation

If the script continues to fail, you can create users manually:

### In Firebase Authentication:
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password for each demo user
4. Note down the UID for each user

### In Firestore:
1. Go to Firestore Database > users collection
2. Create a document with the UID as the document ID
3. Add these fields for each user:

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

## Quick Test Command

After setup, you can test the demo login functionality by running:

```bash
npm run dev
```

Then navigate to the login page and click any Quick Demo Access button. You should be logged in immediately with the appropriate role permissions.

## Security Note

These demo users are for testing purposes only. In production:
1. Change all demo passwords
2. Consider disabling demo users
3. Use proper user management through the Admin Panel
4. Ensure Firestore security rules are properly configured
