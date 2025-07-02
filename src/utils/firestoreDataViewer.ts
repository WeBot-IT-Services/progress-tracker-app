/**
 * Firestore Data Viewer
 * Read-only tool to view and verify existing Firestore data
 * NO RECOVERY OR REPAIR OPERATIONS - ONLY VIEWING
 */

import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface DataSnapshot {
  collection: string;
  totalDocuments: number;
  documents: DocumentSnapshot[];
  lastUpdated: Date;
}

interface DocumentSnapshot {
  id: string;
  data: any;
  hasRequiredFields: boolean;
  missingFields: string[];
}

// Required fields for each collection
const REQUIRED_FIELDS = {
  projects: ['projectName', 'status', 'createdBy'],
  milestones: ['projectId', 'title', 'status'],
  complaints: ['title', 'description', 'status', 'submittedBy'],
  users: ['email', 'role']
};

class FirestoreDataViewer {
  
  // Main function to view all data
  async viewAllData(): Promise<Record<string, DataSnapshot>> {
    console.log('🔍 VIEWING EXISTING FIRESTORE DATA');
    console.log('=' .repeat(60));
    console.log('📋 This is a READ-ONLY operation - no data will be modified');
    console.log('=' .repeat(60));

    const results: Record<string, DataSnapshot> = {};

    try {
      // View each collection
      for (const collectionName of ['projects', 'milestones', 'complaints', 'users']) {
        console.log(`\n📊 VIEWING ${collectionName.toUpperCase()} COLLECTION`);
        console.log('-' .repeat(40));
        
        const snapshot = await this.viewCollection(collectionName);
        results[collectionName] = snapshot;
        
        console.log(`Total documents: ${snapshot.totalDocuments}`);
        
        if (snapshot.totalDocuments > 0) {
          snapshot.documents.forEach((doc, index) => {
            console.log(`\n${index + 1}. Document ID: ${doc.id}`);
            console.log(`   Data:`, JSON.stringify(doc.data, null, 2));
            console.log(`   Has required fields: ${doc.hasRequiredFields ? '✅' : '❌'}`);
            if (doc.missingFields.length > 0) {
              console.log(`   Missing fields: ${doc.missingFields.join(', ')}`);
            }
          });
        } else {
          console.log('   📭 No documents found in this collection');
        }
      }

      // Summary
      console.log('\n📈 SUMMARY OF EXISTING DATA');
      console.log('=' .repeat(40));
      Object.entries(results).forEach(([collection, snapshot]) => {
        console.log(`${collection}: ${snapshot.totalDocuments} documents`);
      });

      const totalDocs = Object.values(results).reduce((sum, snapshot) => sum + snapshot.totalDocuments, 0);
      console.log(`\nTotal documents across all collections: ${totalDocs}`);

      if (totalDocs === 0) {
        console.log('\n⚠️  NO DATA FOUND IN FIRESTORE');
        console.log('This could mean:');
        console.log('  - Data is in a different Firebase project');
        console.log('  - Collections have different names');
        console.log('  - Firebase connection issues');
      } else {
        console.log('\n✅ DATA FOUND IN FIRESTORE');
        console.log('Your data exists and is accessible!');
      }

      return results;

    } catch (error) {
      console.error('❌ Error viewing Firestore data:', error);
      throw error;
    }
  }

  // View a specific collection
  private async viewCollection(collectionName: string): Promise<DataSnapshot> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const requiredFields = REQUIRED_FIELDS[collectionName as keyof typeof REQUIRED_FIELDS] || [];
      
      const documents: DocumentSnapshot[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const missingFields = requiredFields.filter(field => !(field in data));
        
        documents.push({
          id: docSnapshot.id,
          data: data,
          hasRequiredFields: missingFields.length === 0,
          missingFields: missingFields
        });
      });

      return {
        collection: collectionName,
        totalDocuments: querySnapshot.size,
        documents: documents,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error(`Error viewing ${collectionName} collection:`, error);
      return {
        collection: collectionName,
        totalDocuments: 0,
        documents: [],
        lastUpdated: new Date()
      };
    }
  }

  // Test if app services can read the data
  async testDataAccess(): Promise<void> {
    console.log('\n🧪 TESTING APP DATA ACCESS');
    console.log('=' .repeat(40));
    console.log('Testing if app modules can read existing Firestore data...');

    try {
      // Import services dynamically to avoid circular dependencies
      const { projectsService, milestonesService, complaintsService, usersService } = 
        await import('../services/firebaseService');

      // Test projects service
      console.log('\n📊 Testing Projects Service...');
      try {
        const projects = await projectsService.getProjects();
        console.log(`✅ Projects service working: ${projects.length} projects found`);
        
        if (projects.length > 0) {
          console.log('   Sample project:', {
            id: projects[0].id,
            name: projects[0].projectName,
            status: projects[0].status
          });
        }
      } catch (error) {
        console.error('❌ Projects service failed:', error);
      }

      // Test milestones service
      console.log('\n🎯 Testing Milestones Service...');
      try {
        // Get milestones for first project if available
        const projects = await projectsService.getProjects();
        if (projects.length > 0 && projects[0].id) {
          const milestones = await projectsService.getMilestonesByProject(projects[0].id);
          console.log(`✅ Milestones service working: ${milestones.length} milestones found for project ${projects[0].id}`);
        } else {
          console.log('ℹ️  No projects available to test milestones');
        }
      } catch (error) {
        console.error('❌ Milestones service failed:', error);
      }

      // Test complaints service
      console.log('\n📝 Testing Complaints Service...');
      try {
        const complaints = await complaintsService.getComplaints();
        console.log(`✅ Complaints service working: ${complaints.length} complaints found`);
      } catch (error) {
        console.error('❌ Complaints service failed:', error);
      }

      // Test users service
      console.log('\n👥 Testing Users Service...');
      try {
        const users = await usersService.getUsers();
        console.log(`✅ Users service working: ${users.length} users found`);
      } catch (error) {
        console.error('❌ Users service failed:', error);
      }

    } catch (error) {
      console.error('❌ Error testing data access:', error);
    }
  }

  // Check Firebase connection
  async checkFirebaseConnection(): Promise<boolean> {
    console.log('\n🔗 CHECKING FIREBASE CONNECTION');
    console.log('=' .repeat(40));

    try {
      // Simple connectivity test
      await getDocs(query(collection(db, 'projects')));
      console.log('✅ Firebase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
      console.log('Connection error details:', error);
      return false;
    }
  }

  // Export data for inspection
  exportDataToConsole(data: Record<string, DataSnapshot>): void {
    console.log('\n📤 EXPORTABLE DATA STRUCTURE');
    console.log('=' .repeat(40));
    console.log('Copy this data for external inspection:');
    console.log(JSON.stringify(data, null, 2));
  }
}

// Main function to run complete verification
export const verifyExistingData = async () => {
  const viewer = new FirestoreDataViewer();
  
  try {
    // Step 1: Check Firebase connection
    const isConnected = await viewer.checkFirebaseConnection();
    if (!isConnected) {
      console.log('❌ Cannot proceed - Firebase connection failed');
      return { success: false, error: 'Firebase connection failed' };
    }

    // Step 2: View all existing data
    const data = await viewer.viewAllData();

    // Step 3: Test app data access
    await viewer.testDataAccess();

    // Step 4: Export data structure
    viewer.exportDataToConsole(data);

    console.log('\n🎯 VERIFICATION COMPLETE');
    console.log('=' .repeat(40));
    console.log('✅ Data verification completed successfully');
    console.log('📋 Check the console output above for detailed results');

    return { 
      success: true, 
      data: data,
      totalDocuments: Object.values(data).reduce((sum, snapshot) => sum + snapshot.totalDocuments, 0)
    };

  } catch (error) {
    console.error('❌ Data verification failed:', error);
    return { success: false, error: error.message };
  }
};

// Make available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).verifyExistingData = verifyExistingData;
}

export { FirestoreDataViewer };
