// Firestore Data Viewer - Debug utility
import { db } from '../config/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export const verifyExistingData = async () => {
  try {
    if (!db) {
      console.warn('Firebase not initialized');
      return { success: false, message: 'Firebase not initialized' };
    }

    // Check if we can access the users collection
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, limit(1));
    const usersSnapshot = await getDocs(usersQuery);
    
    // Check if we can access the projects collection
    const projectsRef = collection(db, 'projects');
    const projectsQuery = query(projectsRef, limit(1));
    const projectsSnapshot = await getDocs(projectsQuery);

    console.log('✅ Data verification complete:', {
      usersCount: usersSnapshot.size,
      projectsCount: projectsSnapshot.size,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Data verification completed successfully',
      data: {
        usersCount: usersSnapshot.size,
        projectsCount: projectsSnapshot.size
      }
    };
  } catch (error) {
    console.error('❌ Data verification failed:', error);
    return {
      success: false,
      message: `Data verification failed: ${error.message}`,
      error
    };
  }
};

export const listCollections = async () => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const collections = ['users', 'projects', 'complaints', 'notifications'];
    const results = {};

    for (const collectionName of collections) {
      try {
        const ref = collection(db, collectionName);
        const snapshot = await getDocs(query(ref, limit(10)));
        results[collectionName] = {
          count: snapshot.size,
          documents: snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }))
        };
      } catch (error) {
        results[collectionName] = {
          error: error.message
        };
      }
    }

    return results;
  } catch (error) {
    console.error('Error listing collections:', error);
    throw error;
  }
};

export default {
  verifyExistingData,
  listCollections
};
