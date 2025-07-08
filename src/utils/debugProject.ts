// Debug Project Utility - Development debugging tools
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const debugProject = async (projectId: string) => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    console.log('🔍 Debugging project:', projectId);

    // Get project document
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectSnap.data();
    
    // Get related complaints
    const complaintsRef = collection(db, 'complaints');
    const complaintsQuery = query(complaintsRef, where('projectId', '==', projectId));
    const complaintsSnap = await getDocs(complaintsQuery);
    
    // Get related milestones (if any)
    const milestonesRef = collection(db, 'milestones');
    const milestonesQuery = query(milestonesRef, where('projectId', '==', projectId));
    const milestonesSnap = await getDocs(milestonesQuery);

    const debugInfo = {
      project: {
        id: projectId,
        data: projectData,
        exists: true
      },
      complaints: {
        count: complaintsSnap.size,
        items: complaintsSnap.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      },
      milestones: {
        count: milestonesSnap.size,
        items: milestonesSnap.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      },
      metadata: {
        debuggedAt: new Date().toISOString(),
        debuggedBy: 'system'
      }
    };

    console.log('✅ Project debug complete:', debugInfo);
    return debugInfo;

  } catch (error) {
    console.error('❌ Project debug failed:', error);
    return {
      error: error.message,
      projectId,
      debuggedAt: new Date().toISOString()
    };
  }
};

export const debugAllProjects = async (limit = 10) => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    const projects = snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    console.log(`🔍 Debug summary for ${projects.length} projects:`, projects);
    return projects;

  } catch (error) {
    console.error('❌ Debug all projects failed:', error);
    throw error;
  }
};

export default {
  debugProject,
  debugAllProjects
};
