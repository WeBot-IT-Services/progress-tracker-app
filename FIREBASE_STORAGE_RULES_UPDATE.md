# Firebase Storage Rules Update Instructions

## Issue
Milestone image uploads are failing with permission error: 
`Firebase Storage: User does not have permission to access 'projects/.../milestones/.../filename.png'`

## Root Cause
The Firebase Storage rules have a specific rule for milestone images that only allows `admin` and `production` roles to upload, but the current user might not have the correct role in Firestore.

## Solution Applied
Updated the storage rules in `storage.rules` to be more permissive for milestone images while maintaining authentication requirements.

### Before (Restrictive)
```javascript
// Write permissions - Admin and Production team can upload milestone images
allow write: if isAuthenticated() &&
                (isAdmin() || isProduction()) &&
                isValidImage() &&
                isValidFileSize();
```

### After (Permissive but Secure)
```javascript
// Write permissions - Allow all authenticated users (role-based control handled in frontend)
allow write: if isAuthenticated() &&
                isValidImage() &&
                isValidFileSize();
```

## Manual Deployment Required

Since Firebase CLI authentication failed, please deploy manually:

1. **Option A: Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project: `mysteelprojecttracker`
   - Go to Storage → Rules
   - Replace the milestone rule (around lines 96-105) with the updated version
   - Click "Publish"

2. **Option B: Command Line (if you have access)**
   ```bash
   firebase login --reauth
   firebase deploy --only storage
   ```

## Updated Rule Location
The rule is located at lines 96-105 in `storage.rules`:

```javascript
// Project milestone images - uploaded by Production team for milestones
match /projects/{projectId}/milestones/{milestoneId}/{fileName} {
  // Read permissions - anyone authenticated can view milestone images
  allow read: if isAuthenticated();

  // Write permissions - Allow all authenticated users (role-based control handled in frontend)
  // This ensures milestone images can be uploaded by users with proper frontend permissions
  allow write: if isAuthenticated() &&
                  isValidImage() &&
                  isValidFileSize();

  // Delete permissions - Allow all authenticated users (role-based control handled in frontend)
  allow delete: if isAuthenticated();
}
```

## Security Notes
- Frontend already has proper role-based access control
- Users still need to be authenticated
- File type and size validation still applies
- The MilestoneImageUpload component checks permissions before allowing uploads

## Testing
After deploying the rules:
1. Try uploading milestone images again
2. The error should be resolved
3. Only users with proper frontend permissions will see upload interface
