#!/bin/bash

# Force Update Deployment Script
# This script will deploy the updated version and force all users to update

echo "🚀 Starting force update deployment..."

# Step 1: Build the application with the new version
echo "📦 Building application..."
npm run build

# Step 2: Deploy to Firebase (if using Firebase hosting)
if command -v firebase &> /dev/null; then
    echo "🔥 Deploying to Firebase..."
    firebase deploy --only hosting
else
    echo "⚠️  Firebase CLI not found, skipping deployment"
fi

# Step 3: Deploy storage rules if changed
if [ -f "storage.rules" ]; then
    echo "🔒 Deploying storage rules..."
    firebase deploy --only storage
fi

# Step 4: Deploy Firestore rules if changed
if [ -f "firestore.rules" ]; then
    echo "🔒 Deploying Firestore rules..."
    firebase deploy --only firestore:rules
fi

# Step 5: Clear CDN caches (if using a CDN)
echo "🗑️  Clearing CDN caches..."
# Add your CDN cache clearing commands here
# Example for Cloudflare:
# curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
#   -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
#   -H "Content-Type: application/json" \
#   --data '{"purge_everything":true}'

# Step 6: Update version timestamp
echo "🕐 Updating version timestamp..."
CURRENT_TIMESTAMP=$(date +%s)
sed -i.bak "s/\"buildTimestamp\": [0-9]*/\"buildTimestamp\": $CURRENT_TIMESTAMP/" public/version.json

# Step 7: Display force update instructions
echo ""
echo "✅ Force update deployment completed!"
echo ""
echo "📋 Next steps for users experiencing update loops:"
echo "1. Visit: https://your-domain.com/force-update-page.html"
echo "2. Click 'Force Update Now' button"
echo "3. Wait for the update to complete"
echo ""
echo "🔧 Alternative manual steps:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Disable cache in DevTools (F12 → Network → Disable cache)"
echo "3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
echo "4. Clear application storage (DevTools → Application → Clear storage)"
echo ""
echo "🛠️  For developers:"
echo "- Check the updated version.json at: public/version.json"
echo "- Monitor Firebase console for deployment status"
echo "- Test the force update page: /force-update-page.html"
echo ""

# Optional: Send notification to users (if you have a notification system)
# echo "📢 Sending update notification to users..."
# curl -X POST "https://your-api.com/send-notification" \
#   -H "Content-Type: application/json" \
#   --data '{"message":"Critical update available. Please refresh your browser.","type":"update"}'

echo "🎉 Force update deployment script completed!"
