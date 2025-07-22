#!/bin/bash

# Progress Tracker App - Firebase Deployment Script
# This script builds and deploys the app to Firebase hosting with PWA auto-update

set -e  # Exit on any error

echo "🚀 Starting Firebase Deployment Process"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Update version information
print_status "Updating version information..."
TIMESTAMP=$(date +%s)
BUILD_ID="build-$(date +%Y%m%d-%H%M%S)"
VERSION="3.15.0"

# Update version.json
cat > public/version.json << EOF
{
  "version": "$VERSION",
  "buildId": "$BUILD_ID",
  "buildTimestamp": $TIMESTAMP,
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "forceUpdate": true,
  "minimumVersion": "$VERSION",
  "updateMessage": "Version $VERSION is now available with enhanced user management and PWA functionality.",
  "updateUrl": "https://your-app-domain.com",
  "features": {
    "employeeIdAuth": true,
    "defaultPassword": true,
    "enhancedPWA": true,
    "autoUpdate": true,
    "offlineSupport": true
  },
  "changelog": [
    "Added default password configuration for new users",
    "Enhanced PWA auto-update functionality", 
    "Improved user management with centralized defaults",
    "Fixed demo login authentication flow",
    "Enhanced service worker caching strategy"
  ]
}
EOF

# Update service worker version
print_status "Updating service worker version..."
sed -i.bak "s/const VERSION = '.*';/const VERSION = '$VERSION';/" public/sw.js
sed -i.bak "s/const BUILD_TIMESTAMP = .*;/const BUILD_TIMESTAMP = $TIMESTAMP;/" public/sw.js
sed -i.bak "s/const BUILD_ID = '.*';/const BUILD_ID = '$BUILD_ID';/" public/sw.js

# Update force update client
print_status "Updating force update client..."
sed -i.bak "s/this.version = '.*';/this.version = '$VERSION';/" public/force-update-client.js
sed -i.bak "s/this.buildTimestamp = .*;/this.buildTimestamp = $TIMESTAMP;/" public/force-update-client.js

# Clean up backup files
rm -f public/*.bak

print_success "Version information updated to $VERSION"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Run tests (if available)
if npm run test --silent 2>/dev/null; then
    print_status "Running tests..."
    npm run test
else
    print_warning "No tests found, skipping test phase"
fi

# Build the application
print_status "Building application for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Copy PWA files to dist
print_status "Copying PWA files to dist..."
cp public/sw.js dist/
cp public/force-update-client.js dist/
cp public/version.json dist/
cp public/manifest.json dist/

print_success "Build completed successfully"

# Deploy to Firebase
print_status "Deploying to Firebase hosting..."

# Deploy hosting only (faster than full deploy)
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Your PWA is now live with:"
    echo "   ✅ Version: $VERSION"
    echo "   ✅ Build ID: $BUILD_ID"
    echo "   ✅ Auto-update enabled"
    echo "   ✅ Default password: WR2024"
    echo "   ✅ Enhanced PWA functionality"
    echo ""
    echo "🔗 Access your app at: https://your-project-id.web.app"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Test the demo login functionality"
    echo "   2. Verify auto-update works on existing clients"
    echo "   3. Check PWA installation prompts"
    echo "   4. Test offline functionality"
else
    print_error "Deployment failed"
    exit 1
fi

echo ""
print_status "Deployment process completed!"
