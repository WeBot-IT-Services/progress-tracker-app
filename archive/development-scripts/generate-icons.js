#!/usr/bin/env node

/**
 * Icon Generator Script for Mysteel Progress Tracker
 * This script creates favicon and PWA icons from the Mysteel logo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if the logo file exists
const logoPath = path.join(__dirname, 'src', 'assets', 'MYSTEEL定稿 (3).png');
const publicDir = path.join(__dirname, 'public');

console.log('🎨 Mysteel Icon Generator');
console.log('========================');

if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo file not found:', logoPath);
  console.log('Please ensure the Mysteel logo exists at:', logoPath);
  process.exit(1);
}

console.log('✅ Found Mysteel logo at:', logoPath);

console.log('📋 Required icon sizes:');
console.log('- mysteel-favicon.png (32x32) - Browser favicon');
console.log('- mysteel-icon-120.png (120x120) - iOS home screen');
console.log('- mysteel-icon-152.png (152x152) - iPad home screen');
console.log('- mysteel-icon-180.png (180x180) - iPhone home screen');
console.log('- mysteel-icon-192.png (192x192) - Android home screen');
console.log('- mysteel-icon-512.png (512x512) - High-res app icon');

console.log('\n🛠️  Manual Steps Required:');
console.log('1. Use an image editor (Photoshop, GIMP, or online tool like favicon.io)');
console.log('2. Open the logo file:', logoPath);
console.log('3. Create square versions with white background');
console.log('4. Export the following sizes to /public folder:');

const iconSizes = [
  { name: 'mysteel-favicon.png', size: '32x32' },
  { name: 'mysteel-icon-120.png', size: '120x120' },
  { name: 'mysteel-icon-152.png', size: '152x152' },
  { name: 'mysteel-icon-180.png', size: '180x180' },
  { name: 'mysteel-icon-192.png', size: '192x192' },
  { name: 'mysteel-icon-512.png', size: '512x512' }
];

iconSizes.forEach(icon => {
  console.log(`   - ${icon.name} (${icon.size})`);
});

console.log('\n🌐 Online Tools (Recommended):');
console.log('- favicon.io/favicon-converter - Upload PNG, get all sizes');
console.log('- realfavicongenerator.net - Complete favicon generator');
console.log('- favicon-generator.org - Simple favicon creator');

console.log('\n⚡ Quick Fix - Using existing logo as temporary favicon:');

// Create a temporary favicon by copying the logo
try {
  fs.copyFileSync(logoPath, path.join(publicDir, 'mysteel-favicon.png'));
  fs.copyFileSync(logoPath, path.join(publicDir, 'mysteel-icon-120.png'));
  fs.copyFileSync(logoPath, path.join(publicDir, 'mysteel-icon-152.png'));
  fs.copyFileSync(logoPath, path.join(publicDir, 'mysteel-icon-180.png'));
  fs.copyFileSync(logoPath, path.join(publicDir, 'mysteel-icon-192.png'));
  fs.copyFileSync(logoPath, path.join(publicDir, 'mysteel-icon-512.png'));
  
  console.log('✅ Temporary icons created! The favicon should now show the Mysteel logo.');
  console.log('💡 For best results, create properly sized square icons later.');
} catch (error) {
  console.error('❌ Error creating temporary icons:', error.message);
}

console.log('\n🚀 After creating icons, restart your development server to see changes.');
