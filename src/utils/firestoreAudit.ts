/**
 * Firestore Data Audit and Recovery Tool
 * Comprehensive tool to audit, validate, and repair Firestore data integrity
 */

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Project, Milestone, Complaint, User } from '../services/firebaseService';

// Audit results interface
interface AuditResults {
  collections: {
    projects: CollectionAudit;
    milestones: CollectionAudit;
    complaints: CollectionAudit;
    users: CollectionAudit;
  };
  summary: {
    totalDocuments: number;
    validDocuments: number;
    invalidDocuments: number;
    missingFields: string[];
    dataTypeErrors: string[];
    recommendations: string[];
  };
}

interface CollectionAudit {
  name: string;
  totalDocuments: number;
  validDocuments: number;
  invalidDocuments: number;
  documents: DocumentAudit[];
  schema: SchemaValidation;
}

interface DocumentAudit {
  id: string;
  isValid: boolean;
  missingFields: string[];
  invalidFields: string[];
  dataTypeErrors: string[];
  data: any;
}

interface SchemaValidation {
  requiredFields: string[];
  optionalFields: string[];
  fieldTypes: Record<string, string>;
}

// Schema definitions based on TypeScript interfaces
const SCHEMAS = {
  projects: {
    requiredFields: ['projectName', 'status', 'createdBy', 'createdAt', 'updatedAt'],
    optionalFields: ['description', 'amount', 'deliveryDate'],
    fieldTypes: {
      projectName: 'string',
      description: 'string',
      amount: 'number',
      deliveryDate: 'string',
      status: 'string',
      createdBy: 'string',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },
  milestones: {
    requiredFields: ['projectId', 'title', 'status', 'createdAt', 'updatedAt'],
    optionalFields: ['description', 'dueDate', 'completedAt', 'images'],
    fieldTypes: {
      projectId: 'string',
      title: 'string',
      description: 'string',
      status: 'string',
      dueDate: 'string',
      completedAt: 'timestamp',
      images: 'array',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },
  complaints: {
    requiredFields: ['title', 'description', 'status', 'submittedBy', 'createdAt'],
    optionalFields: ['assignedTo', 'department', 'priority', 'resolvedAt', 'updatedAt'],
    fieldTypes: {
      title: 'string',
      description: 'string',
      status: 'string',
      submittedBy: 'string',
      assignedTo: 'string',
      department: 'string',
      priority: 'string',
      resolvedAt: 'timestamp',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },
  users: {
    requiredFields: ['email', 'role', 'createdAt'],
    optionalFields: ['name', 'updatedAt', 'lastLogin'],
    fieldTypes: {
      email: 'string',
      name: 'string',
      role: 'string',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      lastLogin: 'timestamp'
    }
  }
};

class FirestoreAuditor {
  private auditResults: AuditResults;

  constructor() {
    this.auditResults = {
      collections: {
        projects: this.initCollectionAudit('projects'),
        milestones: this.initCollectionAudit('milestones'),
        complaints: this.initCollectionAudit('complaints'),
        users: this.initCollectionAudit('users')
      },
      summary: {
        totalDocuments: 0,
        validDocuments: 0,
        invalidDocuments: 0,
        missingFields: [],
        dataTypeErrors: [],
        recommendations: []
      }
    };
  }

  private initCollectionAudit(collectionName: string): CollectionAudit {
    return {
      name: collectionName,
      totalDocuments: 0,
      validDocuments: 0,
      invalidDocuments: 0,
      documents: [],
      schema: SCHEMAS[collectionName as keyof typeof SCHEMAS]
    };
  }

  // Main audit function
  async performFullAudit(): Promise<AuditResults> {
    console.log('🔍 Starting comprehensive Firestore data audit...');

    try {
      // Audit each collection
      await this.auditCollection('projects');
      await this.auditCollection('milestones');
      await this.auditCollection('complaints');
      await this.auditCollection('users');

      // Generate summary
      this.generateSummary();

      console.log('✅ Firestore audit completed');
      return this.auditResults;

    } catch (error) {
      console.error('❌ Firestore audit failed:', error);
      throw error;
    }
  }

  // Audit individual collection
  private async auditCollection(collectionName: string): Promise<void> {
    console.log(`🔍 Auditing ${collectionName} collection...`);

    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const collectionAudit = this.auditResults.collections[collectionName as keyof typeof this.auditResults.collections];
      
      collectionAudit.totalDocuments = querySnapshot.size;

      querySnapshot.forEach((docSnapshot) => {
        const documentAudit = this.auditDocument(
          docSnapshot.id,
          docSnapshot.data(),
          collectionAudit.schema
        );
        
        collectionAudit.documents.push(documentAudit);
        
        if (documentAudit.isValid) {
          collectionAudit.validDocuments++;
        } else {
          collectionAudit.invalidDocuments++;
        }
      });

      console.log(`✅ ${collectionName}: ${collectionAudit.validDocuments}/${collectionAudit.totalDocuments} valid documents`);

    } catch (error) {
      console.error(`❌ Failed to audit ${collectionName}:`, error);
    }
  }

  // Audit individual document
  private auditDocument(id: string, data: any, schema: SchemaValidation): DocumentAudit {
    const audit: DocumentAudit = {
      id,
      isValid: true,
      missingFields: [],
      invalidFields: [],
      dataTypeErrors: [],
      data
    };

    // Check required fields
    schema.requiredFields.forEach(field => {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        audit.missingFields.push(field);
        audit.isValid = false;
      }
    });

    // Check data types
    Object.keys(data).forEach(field => {
      if (schema.fieldTypes[field]) {
        const expectedType = schema.fieldTypes[field];
        const actualValue = data[field];
        
        if (!this.validateFieldType(actualValue, expectedType)) {
          audit.dataTypeErrors.push(`${field}: expected ${expectedType}, got ${typeof actualValue}`);
          audit.isValid = false;
        }
      }
    });

    return audit;
  }

  // Validate field type
  private validateFieldType(value: any, expectedType: string): boolean {
    if (value === null || value === undefined) return false;

    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'timestamp':
        return value && (value.toDate || value.seconds !== undefined);
      default:
        return true;
    }
  }

  // Generate audit summary
  private generateSummary(): void {
    const collections = Object.values(this.auditResults.collections);
    
    this.auditResults.summary.totalDocuments = collections.reduce((sum, col) => sum + col.totalDocuments, 0);
    this.auditResults.summary.validDocuments = collections.reduce((sum, col) => sum + col.validDocuments, 0);
    this.auditResults.summary.invalidDocuments = collections.reduce((sum, col) => sum + col.invalidDocuments, 0);

    // Collect all missing fields and data type errors
    collections.forEach(collection => {
      collection.documents.forEach(doc => {
        this.auditResults.summary.missingFields.push(...doc.missingFields);
        this.auditResults.summary.dataTypeErrors.push(...doc.dataTypeErrors);
      });
    });

    // Remove duplicates
    this.auditResults.summary.missingFields = [...new Set(this.auditResults.summary.missingFields)];
    this.auditResults.summary.dataTypeErrors = [...new Set(this.auditResults.summary.dataTypeErrors)];

    // Generate recommendations
    this.generateRecommendations();
  }

  // Generate repair recommendations
  private generateRecommendations(): void {
    const recommendations: string[] = [];

    if (this.auditResults.summary.invalidDocuments > 0) {
      recommendations.push(`Found ${this.auditResults.summary.invalidDocuments} invalid documents that need repair`);
    }

    if (this.auditResults.summary.missingFields.length > 0) {
      recommendations.push(`Missing fields detected: ${this.auditResults.summary.missingFields.join(', ')}`);
    }

    if (this.auditResults.summary.dataTypeErrors.length > 0) {
      recommendations.push(`Data type errors found: ${this.auditResults.summary.dataTypeErrors.length} issues`);
    }

    this.auditResults.summary.recommendations = recommendations;
  }

  // Export audit results to console and return for further processing
  exportResults(): AuditResults {
    console.log('\n📊 FIRESTORE AUDIT RESULTS');
    console.log('=' .repeat(50));
    
    console.log('\n📈 SUMMARY:');
    console.log(`Total Documents: ${this.auditResults.summary.totalDocuments}`);
    console.log(`Valid Documents: ${this.auditResults.summary.validDocuments}`);
    console.log(`Invalid Documents: ${this.auditResults.summary.invalidDocuments}`);
    
    if (this.auditResults.summary.missingFields.length > 0) {
      console.log(`\n❌ Missing Fields: ${this.auditResults.summary.missingFields.join(', ')}`);
    }
    
    if (this.auditResults.summary.dataTypeErrors.length > 0) {
      console.log(`\n⚠️ Data Type Errors: ${this.auditResults.summary.dataTypeErrors.length}`);
    }

    console.log('\n📋 COLLECTION DETAILS:');
    Object.values(this.auditResults.collections).forEach(collection => {
      console.log(`\n${collection.name.toUpperCase()}:`);
      console.log(`  Total: ${collection.totalDocuments}`);
      console.log(`  Valid: ${collection.validDocuments}`);
      console.log(`  Invalid: ${collection.invalidDocuments}`);
      
      if (collection.invalidDocuments > 0) {
        console.log(`  Invalid Documents:`);
        collection.documents
          .filter(doc => !doc.isValid)
          .forEach(doc => {
            console.log(`    - ${doc.id}: ${doc.missingFields.join(', ')} ${doc.dataTypeErrors.join(', ')}`);
          });
      }
    });

    if (this.auditResults.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.auditResults.summary.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }

    return this.auditResults;
  }
}

// Export the auditor class and utility functions
export { FirestoreAuditor };
export type { AuditResults, CollectionAudit, DocumentAudit };
