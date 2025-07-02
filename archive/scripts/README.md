# Firestore Population Script - Node.js

This Node.js script will populate your Firestore database with mysteel Construction data including users, projects, and complaints.

## 🔧 Setup Instructions

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click on **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Rename it to `serviceAccountKey.json`
8. Place it in the `scripts/` folder

### 2. Update Project Configuration

Edit `populate-firestore-node.js` and update:

```javascript
// Replace 'your-project-id' with your actual Firebase project ID
projectId: 'your-actual-project-id'
```

### 3. Install Dependencies

```bash
cd scripts
npm install firebase-admin
```

### 4. Run the Script

```bash
# From the scripts directory
node populate-firestore-node.js

# Or use the npm script
npm run populate
```

## 📊 What the Script Creates

### Firebase Authentication Users (5)
- **admin@mysteel.com** - System Administrator
- **sales@mysteel.com** - Sales Manager  
- **design@mysteel.com** - Design Engineer
- **production@mysteel.com** - Production Manager
- **installation@mysteel.com** - Installation Supervisor

### Firestore Collections

#### `users` Collection (5 documents)
- User profiles with roles, departments, and metadata
- Links to Firebase Auth UIDs

#### `projects` Collection (5 documents)
- Sample projects in different workflow stages:
  - Sales stage (1 project)
  - Design stage (1 project) 
  - Production stage (1 project)
  - Installation stage (1 project)
  - Completed (1 project)

#### `complaints` Collection (3 documents)
- Sample complaints assigned to different departments:
  - Installation department complaint
  - Design department complaint
  - Production department complaint

## 🔐 Login Credentials

After running the script, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mysteel.com | MS2024!Admin#Secure |
| Sales | sales@mysteel.com | MS2024!Sales#Manager |
| Design | design@mysteel.com | MS2024!Design#Engineer |
| Production | production@mysteel.com | MS2024!Prod#Manager |
| Installation | installation@mysteel.com | MS2024!Install#Super |

## 🚨 Important Notes

1. **Clear Existing Data**: Make sure to clear your Firestore database before running this script
2. **Service Account**: Keep your `serviceAccountKey.json` file secure and never commit it to version control
3. **Project ID**: Make sure to update the project ID in the script
4. **One-Time Use**: This script is designed to be run once to set up initial data

## 🔍 Troubleshooting

### Error: "Service account key not found"
- Make sure `serviceAccountKey.json` is in the `scripts/` folder
- Check that the file is properly downloaded from Firebase Console

### Error: "Project not found"
- Verify your project ID is correct in the script
- Make sure your service account has the right permissions

### Error: "Email already exists"
- The script handles this gracefully and will continue
- Existing users won't be overwritten

### Error: "Permission denied"
- Check your Firebase Security Rules
- Make sure your service account has admin privileges

## 📁 File Structure

```
scripts/
├── populate-firestore-node.js    # Main script
├── package.json                  # Dependencies
├── serviceAccountKey.json        # Your Firebase key (add this)
└── README.md                     # This file
```

## 🎯 Next Steps

After running the script:

1. **Test Login**: Use the quick demo buttons on your login page
2. **Verify Data**: Check Firebase Console to see the created data
3. **Test Permissions**: Login with different roles to test access controls
4. **Clean Up**: Remove or secure the service account key file

## 🔄 Re-running the Script

If you need to re-run the script:

1. **Clear Firestore**: Delete all collections in Firebase Console
2. **Delete Auth Users**: Remove users from Firebase Authentication
3. **Run Script**: Execute the script again

The script will create fresh data each time.
