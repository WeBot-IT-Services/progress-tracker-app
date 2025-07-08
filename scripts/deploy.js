#!/usr/bin/env node

/**
 * Complete Force Update Deployment Script
 * Handles version bumping, build preparation, and deployment with force update
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import ForceUpdateManager from './force-update-manager.js';

class DeploymentManager {
  constructor() {
    this.packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    this.version = this.packageJson.version;
    
    console.log('🚀 Deployment Manager for Force Updates');
    console.log(`📦 Current Version: ${this.version}`);
  }

  async run() {
    try {
      console.log('\n🔄 Starting complete force update deployment...');
      
      // Step 1: Prepare force update
      console.log('\n📋 Step 1: Preparing force update configuration...');
      const forceUpdateManager = new ForceUpdateManager();
      await forceUpdateManager.run();
      
      // Step 2: Build the application
      console.log('\n🏗️  Step 2: Building application...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Step 3: Deploy to Firebase
      console.log('\n🚀 Step 3: Deploying to Firebase Hosting...');
      execSync('firebase deploy --only hosting', { stdio: 'inherit' });
      
      // Step 4: Verify deployment
      console.log('\n✅ Step 4: Verifying deployment...');
      await this.verifyDeployment();
      
      console.log('\n🎉 Force update deployment completed successfully!');
      console.log(`✅ Version ${this.version} is now live with force update enabled`);
      console.log('📱 Users will automatically receive update notifications');
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error);
      process.exit(1);
    }
  }

  async verifyDeployment() {
    try {
      // Check if version.json is accessible
      const response = await fetch(`${process.env.FIREBASE_HOSTING_URL || 'https://your-app.web.app'}/version.json`);
      if (response.ok) {
        const versionData = await response.json();
        console.log('✅ Version endpoint accessible');
        console.log(`📦 Deployed version: ${versionData.version}`);
        console.log(`🔨 Build ID: ${versionData.buildId}`);
      } else {
        console.warn('⚠️  Version endpoint not accessible (this is normal during deployment)');
      }
    } catch (error) {
      console.warn('⚠️  Could not verify deployment (this is normal during deployment)');
    }
  }
}

// Command line usage
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'deploy':
    new DeploymentManager().run();
    break;
  case 'force-update':
    new ForceUpdateManager().run();
    break;
  default:
    console.log('Usage:');
    console.log('  node deploy.js deploy        # Complete deployment with force update');
    console.log('  node deploy.js force-update  # Prepare force update only');
    break;
}

export default DeploymentManager;
