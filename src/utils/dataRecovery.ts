/**
 * Data Recovery and Repair Tool
 * Handles missing data recovery and document structure repairs
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllProjects, getAllUsers, getConflicts } from '../services/offlineStorage';
import type { Project, Milestone, Complaint, User } from '../services/firebaseService';
import type { AuditResults, DocumentAudit } from './firestoreAudit';

interface RepairOperation {
  collection: string;
  documentId: string;
  operation: 'update' | 'create' | 'migrate';
  data: any;
  reason: string;
}

interface RecoveryResults {
  operations: RepairOperation[];
  migratedFromLocal: number;
  repairedDocuments: number;
  createdDocuments: number;
  errors: string[];
  success: boolean;
}

class DataRecoveryTool {
  private repairOperations: RepairOperation[] = [];
  private errors: string[] = [];

  // Main recovery function
  async performDataRecovery(auditResults: AuditResults): Promise<RecoveryResults> {
    console.log('🔧 Starting data recovery and repair process...');

    try {
      // Step 1: Check for data in local storage that should be migrated
      await this.checkLocalStorageData();

      // Step 2: Repair invalid documents
      await this.repairInvalidDocuments(auditResults);

      // Step 3: Execute all repair operations
      const results = await this.executeRepairOperations();

      console.log('✅ Data recovery completed');
      return results;

    } catch (error) {
      console.error('❌ Data recovery failed:', error);
      this.errors.push(`Recovery failed: ${error.message}`);
      return this.getFailureResults();
    }
  }

  // Check local storage for data that should be migrated to Firestore
  private async checkLocalStorageData(): Promise<void> {
    console.log('🔍 Checking local storage for data to migrate...');

    try {
      // Check for projects in local storage
      const localProjects = await getAllProjects();
      if (localProjects.length > 0) {
        console.log(`Found ${localProjects.length} projects in local storage`);
        
        for (const project of localProjects) {
          // Check if this project exists in Firestore
          const exists = await this.checkDocumentExists('projects', project.id);
          
          if (!exists) {
            this.repairOperations.push({
              collection: 'projects',
              documentId: project.id,
              operation: 'migrate',
              data: this.sanitizeProjectData(project),
              reason: 'Migrate from local storage'
            });
          }
        }
      }

      // Check for users in local storage
      const localUsers = await getAllUsers();
      if (localUsers.length > 0) {
        console.log(`Found ${localUsers.length} users in local storage`);
        
        for (const user of localUsers) {
          const exists = await this.checkDocumentExists('users', user.uid);
          
          if (!exists) {
            this.repairOperations.push({
              collection: 'users',
              documentId: user.uid,
              operation: 'migrate',
              data: this.sanitizeUserData(user),
              reason: 'Migrate from local storage'
            });
          }
        }
      }

      // Check for conflicts that might indicate lost data
      const conflicts = await getConflicts();
      if (conflicts.length > 0) {
        console.log(`Found ${conflicts.length} conflicts that may indicate data loss`);
        // Handle conflicts based on the conflict resolution strategy
        for (const conflict of conflicts) {
          await this.handleDataConflict(conflict);
        }
      }

    } catch (error) {
      console.error('Error checking local storage:', error);
      this.errors.push(`Local storage check failed: ${error.message}`);
    }
  }

  // Repair invalid documents based on audit results
  private async repairInvalidDocuments(auditResults: AuditResults): Promise<void> {
    console.log('🔧 Repairing invalid documents...');

    for (const [collectionName, collectionAudit] of Object.entries(auditResults.collections)) {
      for (const docAudit of collectionAudit.documents) {
        if (!docAudit.isValid) {
          const repairData = await this.generateRepairData(collectionName, docAudit);
          
          if (repairData) {
            this.repairOperations.push({
              collection: collectionName,
              documentId: docAudit.id,
              operation: 'update',
              data: repairData,
              reason: `Repair missing fields: ${docAudit.missingFields.join(', ')}`
            });
          }
        }
      }
    }
  }

  // Generate repair data for invalid documents
  private async generateRepairData(collectionName: string, docAudit: DocumentAudit): Promise<any> {
    const repairData: any = {};

    // Add missing required fields with default values
    for (const missingField of docAudit.missingFields) {
      switch (missingField) {
        case 'createdAt':
        case 'updatedAt':
          repairData[missingField] = serverTimestamp();
          break;
        case 'status':
          if (collectionName === 'projects') {
            repairData[missingField] = 'sales'; // Default project status
          } else if (collectionName === 'milestones') {
            repairData[missingField] = 'pending';
          } else if (collectionName === 'complaints') {
            repairData[missingField] = 'open';
          }
          break;
        case 'projectName':
          repairData[missingField] = `Recovered Project ${docAudit.id}`;
          break;
        case 'title':
          repairData[missingField] = `Recovered ${collectionName.slice(0, -1)} ${docAudit.id}`;
          break;
        case 'description':
          repairData[missingField] = 'Data recovered from corrupted document';
          break;
        case 'createdBy':
        case 'submittedBy':
          repairData[missingField] = 'system-recovery';
          break;
        case 'role':
          repairData[missingField] = 'sales'; // Default role
          break;
        case 'email':
          repairData[missingField] = `recovered-${docAudit.id}@mysteer.com`;
          break;
        default:
          console.warn(`Unknown missing field: ${missingField}`);
      }
    }

    return Object.keys(repairData).length > 0 ? repairData : null;
  }

  // Execute all repair operations
  private async executeRepairOperations(): Promise<RecoveryResults> {
    console.log(`🚀 Executing ${this.repairOperations.length} repair operations...`);

    const results: RecoveryResults = {
      operations: this.repairOperations,
      migratedFromLocal: 0,
      repairedDocuments: 0,
      createdDocuments: 0,
      errors: [...this.errors],
      success: true
    };

    // Use batch operations for efficiency
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    for (const operation of this.repairOperations) {
      try {
        const docRef = doc(db, operation.collection, operation.documentId);

        switch (operation.operation) {
          case 'create':
          case 'migrate':
            batch.set(docRef, {
              ...operation.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            if (operation.operation === 'migrate') {
              results.migratedFromLocal++;
            } else {
              results.createdDocuments++;
            }
            break;

          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: serverTimestamp()
            });
            results.repairedDocuments++;
            break;
        }

        batchCount++;

        // Execute batch when it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`✅ Executed batch of ${batchCount} operations`);
          batchCount = 0;
        }

      } catch (error) {
        console.error(`Failed to execute operation for ${operation.documentId}:`, error);
        results.errors.push(`${operation.documentId}: ${error.message}`);
        results.success = false;
      }
    }

    // Execute remaining operations
    if (batchCount > 0) {
      try {
        await batch.commit();
        console.log(`✅ Executed final batch of ${batchCount} operations`);
      } catch (error) {
        console.error('Failed to execute final batch:', error);
        results.errors.push(`Final batch failed: ${error.message}`);
        results.success = false;
      }
    }

    return results;
  }

  // Helper functions
  private async checkDocumentExists(collection: string, documentId: string): Promise<boolean> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, collection), where('__name__', '==', documentId))
      );
      return !querySnapshot.empty;
    } catch (error) {
      console.warn(`Error checking document existence: ${error}`);
      return false;
    }
  }

  private sanitizeProjectData(project: any): Partial<Project> {
    return {
      projectName: project.projectName || `Recovered Project ${project.id}`,
      description: project.description || '',
      amount: typeof project.amount === 'number' ? project.amount : 0,
      deliveryDate: project.deliveryDate || '',
      status: project.status || 'sales',
      createdBy: project.createdBy || 'system-recovery'
    };
  }

  private sanitizeUserData(user: any): Partial<User> {
    return {
      email: user.email || `recovered-${user.uid}@mysteer.com`,
      name: user.name || `Recovered User ${user.uid}`,
      role: user.role || 'sales'
    };
  }

  private async handleDataConflict(conflict: any): Promise<void> {
    // Implement conflict resolution based on the conflict type
    console.log('Handling data conflict:', conflict);
    
    // For now, we'll prefer server data over local data
    // This can be enhanced based on specific conflict resolution strategies
  }

  private getFailureResults(): RecoveryResults {
    return {
      operations: this.repairOperations,
      migratedFromLocal: 0,
      repairedDocuments: 0,
      createdDocuments: 0,
      errors: this.errors,
      success: false
    };
  }

  // Export results for logging
  exportResults(results: RecoveryResults): void {
    console.log('\n🔧 DATA RECOVERY RESULTS');
    console.log('=' .repeat(50));
    console.log(`Success: ${results.success ? '✅' : '❌'}`);
    console.log(`Total Operations: ${results.operations.length}`);
    console.log(`Migrated from Local: ${results.migratedFromLocal}`);
    console.log(`Repaired Documents: ${results.repairedDocuments}`);
    console.log(`Created Documents: ${results.createdDocuments}`);
    
    if (results.errors.length > 0) {
      console.log(`\n❌ Errors (${results.errors.length}):`);
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (results.operations.length > 0) {
      console.log('\n📋 Operations Performed:');
      results.operations.forEach(op => {
        console.log(`  - ${op.operation.toUpperCase()} ${op.collection}/${op.documentId}: ${op.reason}`);
      });
    }
  }
}

export { DataRecoveryTool };
export type { RepairOperation, RecoveryResults };
