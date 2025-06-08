// Project Data Service
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Project, ProjectStatus, DesignData, ProductionData, InstallationData, Milestone } from '../types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
};

// Convert Firestore document to Project
const convertFirestoreProject = (doc: any): Project => {
  const data = doc.data();
  return {
    id: doc.id,
    projectName: data.projectName,
    amount: data.amount,
    estimatedCompletionDate: convertTimestamp(data.estimatedCompletionDate),
    status: data.status,
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    salesData: data.salesData,
    designData: data.designData,
    productionData: data.productionData,
    installationData: data.installationData
  };
};

// Create new project
export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
};

// Get project by ID
export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertFirestoreProject(docSnap);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    throw new Error('Failed to get project');
  }
};

// Get projects by status
export const getProjectsByStatus = async (status: ProjectStatus): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('status', '==', status),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertFirestoreProject);
  } catch (error) {
    console.error('Error getting projects by status:', error);
    throw new Error('Failed to get projects');
  }
};

// Get projects by user
export const getProjectsByUser = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('createdBy', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertFirestoreProject);
  } catch (error) {
    console.error('Error getting projects by user:', error);
    throw new Error('Failed to get user projects');
  }
};

// Get all projects (admin only)
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertFirestoreProject);
  } catch (error) {
    console.error('Error getting all projects:', error);
    throw new Error('Failed to get projects');
  }
};

// Update project
export const updateProject = async (
  projectId: string,
  updates: Partial<Project>
): Promise<void> => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
};

// Update project status
export const updateProjectStatus = async (
  projectId: string,
  status: ProjectStatus
): Promise<void> => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    throw new Error('Failed to update project status');
  }
};

// Delete project
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
};

// Real-time listeners
export const subscribeToProjects = (
  callback: (projects: Project[]) => void,
  status?: ProjectStatus
): (() => void) => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, 'projects'),
        where('status', '==', status),
        orderBy('updatedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'projects'),
        orderBy('updatedAt', 'desc')
      );
    }

    return onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(convertFirestoreProject);
      callback(projects);
    });
  } catch (error) {
    console.error('Error subscribing to projects:', error);
    throw new Error('Failed to subscribe to projects');
  }
};

// Subscribe to user projects
export const subscribeToUserProjects = (
  userId: string,
  callback: (projects: Project[]) => void
): (() => void) => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('createdBy', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(convertFirestoreProject);
      callback(projects);
    });
  } catch (error) {
    console.error('Error subscribing to user projects:', error);
    throw new Error('Failed to subscribe to user projects');
  }
};

// Sales module functions
export const submitSalesProject = async (
  projectName: string,
  amount: number,
  estimatedCompletionDate: Date,
  createdBy: string,
  notes?: string
): Promise<string> => {
  const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
    projectName,
    amount,
    estimatedCompletionDate,
    status: 'sales',
    createdBy,
    salesData: {
      projectId: '', // Will be set after creation
      submittedBy: createdBy,
      submittedAt: new Date(),
      notes
    }
  };

  const projectId = await createProject(projectData);
  
  // Update sales data with project ID
  await updateProject(projectId, {
    salesData: {
      ...projectData.salesData!,
      projectId
    }
  });

  return projectId;
};

// Design module functions
export const updateDesignStatus = async (
  projectId: string,
  status: 'partial' | 'completed',
  assignedTo: string,
  notes?: string
): Promise<void> => {
  const designData: DesignData = {
    projectId,
    status,
    assignedTo,
    notes,
    lastModified: new Date(),
    ...(status === 'partial' ? { partialCompletedAt: new Date() } : { completedAt: new Date() })
  };

  await updateProject(projectId, {
    designData,
    status: 'dne'
  });

  // If completed, move to production
  if (status === 'completed') {
    await updateProjectStatus(projectId, 'production');
  }
};

// Production module functions
export const updateProductionMilestones = async (
  projectId: string,
  milestones: Milestone[],
  assignedBy: string,
  notes?: string
): Promise<void> => {
  const productionData: ProductionData = {
    projectId,
    milestones,
    assignedBy,
    assignedAt: new Date(),
    lastModified: new Date(),
    notes
  };

  await updateProject(projectId, {
    productionData,
    status: 'production'
  });
};

// Installation module functions
export const updateInstallationProgress = async (
  projectId: string,
  milestoneId: string,
  status: 'pending' | 'in-progress' | 'completed',
  assignedTo: string,
  photoUrls?: string[]
): Promise<void> => {
  const project = await getProject(projectId);
  if (!project || !project.installationData) {
    throw new Error('Project or installation data not found');
  }

  // Update milestone status
  const updatedMilestoneStatuses = {
    ...project.installationData.milestoneStatuses,
    [milestoneId]: status
  };

  // Add photos if provided
  const newPhotos = photoUrls ? photoUrls.map((url, index) => ({
    id: `${milestoneId}-${Date.now()}-${index}`,
    url,
    uploadedAt: new Date(),
    uploadedBy: assignedTo,
    milestoneId
  })) : [];

  const installationData: InstallationData = {
    ...project.installationData,
    milestoneStatuses: updatedMilestoneStatuses,
    photos: [...project.installationData.photos, ...newPhotos],
    lastModified: new Date(),
    ...(status === 'completed' && !project.installationData.completedAt ? { completedAt: new Date() } : {})
  };

  await updateProject(projectId, {
    installationData
  });

  // Check if all milestones are completed
  const allCompleted = Object.values(updatedMilestoneStatuses).every(s => s === 'completed');
  if (allCompleted) {
    await updateProjectStatus(projectId, 'completed');
  }
};

// Get project statistics
export const getProjectStatistics = async () => {
  try {
    const allProjects = await getAllProjects();
    
    const stats = {
      total: allProjects.length,
      sales: allProjects.filter(p => p.status === 'sales').length,
      design: allProjects.filter(p => p.status === 'dne').length,
      production: allProjects.filter(p => p.status === 'production').length,
      installation: allProjects.filter(p => p.status === 'installation').length,
      completed: allProjects.filter(p => p.status === 'completed').length,
      totalValue: allProjects.reduce((sum, p) => sum + p.amount, 0)
    };

    return stats;
  } catch (error) {
    console.error('Error getting project statistics:', error);
    throw new Error('Failed to get project statistics');
  }
};
