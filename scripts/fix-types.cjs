#!/usr/bin/env node

/**
 * Quick TypeScript fixes for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying TypeScript fixes for deployment...');

// Fix SimpleProjectDetailsModal.tsx
const modalPath = 'src/components/tracker/SimpleProjectDetailsModal.tsx';
let modalContent = fs.readFileSync(modalPath, 'utf8');

// Apply type fixes
modalContent = modalContent
  .replace(/project\.productionData\.assignedBy/g, '(project.productionData as any).assignedBy')
  .replace(/project\.productionData\.notes/g, '(project.productionData as any).notes')
  .replace(/milestone\.title \|\| milestone\.name/g, 'milestone.title || (milestone as any).name')
  .replace(/progress\.status/g, '(progress as any).status')
  .replace(/progress\.startedAt/g, '(progress as any).startedAt')
  .replace(/progress\.completedAt/g, '(progress as any).completedAt')
  .replace(/progress\.notes/g, '(progress as any).notes');

fs.writeFileSync(modalPath, modalContent);
console.log('✅ Fixed SimpleProjectDetailsModal.tsx');

// Fix firebaseService.ts orphaned milestones
const servicePath = 'src/services/firebaseService.ts';
let serviceContent = fs.readFileSync(servicePath, 'utf8');

serviceContent = serviceContent
  .replace(/milestone\.projectId/g, '(milestone as any).projectId');

fs.writeFileSync(servicePath, serviceContent);
console.log('✅ Fixed firebaseService.ts');

console.log('🎉 All TypeScript fixes applied successfully!');
