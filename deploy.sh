#!/bin/bash

# 🚀 Mysteel Construction Progress Tracker - Deployment Script
# This script automates the deployment process to Firebase

set -e  # Exit on any error

echo "🚀 Starting deployment of Mysteel Construction Progress Tracker..."

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
    print_error "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
    print_success "Firebase CLI installed successfully"
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_warning "Not logged in to Firebase. Please run 'firebase login' first."
    exit 1
fi

# Verify we're in the correct project directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it with your Firebase configuration."
    exit 1
fi

print_status "Installing dependencies..."
npm install

print_status "Running TypeScript checks..."
npm run build

print_success "Build completed successfully!"

# Deploy security rules first
print_status "Deploying Firestore security rules..."
firebase deploy --only firestore:rules

print_status "Deploying Storage security rules..."
firebase deploy --only storage

print_status "Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Deploy the application
print_status "Deploying application to Firebase Hosting..."
firebase deploy --only hosting

print_success "🎉 Deployment completed successfully!"

# Get the hosting URL
HOSTING_URL=$(firebase hosting:sites:list --json | grep -o '"url":"[^"]*' | grep -o '[^"]*$' | head -1)

if [ ! -z "$HOSTING_URL" ]; then
    print_success "🌐 Your application is live at: $HOSTING_URL"
else
    print_success "🌐 Your application is live at: https://mysteelprojecttracker.web.app"
fi

echo ""
echo "📋 Post-deployment checklist:"
echo "  ✅ Security rules deployed"
echo "  ✅ Database indexes deployed"
echo "  ✅ Application deployed to hosting"
echo "  🔄 Test the application with different user roles"
echo "  🧪 Run security tests in the admin panel"
echo "  📱 Test PWA functionality on mobile devices"
echo ""

print_status "Creating test users and sample data..."
echo "To set up test users and sample data, open the deployed app and:"
echo "1. Open browser console (F12)"
echo "2. Run: createTestUsers()"
echo "3. Run: seedData()"
echo "4. Run: showLoginCredentials()"
echo ""

print_success "Deployment script completed! 🚀"
