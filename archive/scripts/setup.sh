#!/bin/bash

# Setup script for Firestore population
echo "🚀 Setting up Firestore Population Scripts for mysteel Construction"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Navigate to scripts directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install firebase firebase-admin

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔧 Setup Instructions:"
echo "======================"
echo ""
echo "OPTION 1: Admin SDK (Recommended)"
echo "1. Go to Firebase Console > Project Settings > Service Accounts"
echo "2. Click 'Generate new private key'"
echo "3. Save the file as 'serviceAccountKey.json' in this scripts/ folder"
echo "4. Update the project ID in 'populate-firestore-node.js'"
echo "5. Run: node populate-firestore-node.js"
echo ""
echo "OPTION 2: Web SDK (Simpler)"
echo "1. Update Firebase config in 'populate-simple.js'"
echo "2. Run: node populate-simple.js"
echo ""
echo "🔐 After running, you can login with:"
echo "   admin@mysteel.com | MS2024!Admin#Secure"
echo "   sales@mysteel.com | MS2024!Sales#Manager"
echo "   design@mysteel.com | MS2024!Design#Engineer"
echo "   production@mysteel.com | MS2024!Prod#Manager"
echo "   installation@mysteel.com | MS2024!Install#Super"
echo ""
echo "✅ Setup complete! Choose your preferred option above."
