import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, isDevelopmentMode } from '../config/firebase';
// Remove localData import - using Firebase only

// Types
export interface Project {
  id?: string;
  projectName: string;
  name?: string; // Add alias for compatibility
  description?: string;
  amount?: number;
  deliveryDate: string;
  estimatedCompletionDate?: Date; // Add for compatibility
  completionDate?: Date; // Add for compatibility
  status: 'sales' | 'dne' | 'production' | 'installation' | 'completed';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
  files?: string[];
  // Enhanced fields for better tracking
  salesData?: {
    deliveryDate?: Date;
    completedAt?: Date;
    lastModified: Date;
  };
  designData?: {
    status: 'pending' | 'partial' | 'completed';
    assignedAt?: Date; // Add for compatibility
    hasFlowedFromPartial?: boolean;
    partialCompletedAt?: Date;
    completedAt?: Date;
    deliveryDate?: Date;
    lastModified: Date;
  };
  productionData?: {
    milestones?: any[]; // Add for compatibility
    assignedAt?: Date;
    deliveryDate?: Date;
    completedAt?: Date;
    lastModified: Date;
  };
  installationData?: {
    notes?: string; // Add for compatibility
    assignedAt?: Date; // Add for compatibility
    milestoneProgress?: Record<string, {
      status: 'pending' | 'in-progress' | 'completed';
      startedAt?: Date;
      completedAt?: Date;
    }>;
    deliveryDate?: Date;
    completedAt?: Date;
    lastModified: Date;
  };
  photoMetadata?: Array<{
    url: string;
    date: string;
    milestoneId?: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
}

export interface Complaint {
  id?: string;
  title: string;
  description: string;
  customerName: string;
  projectId: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  department: 'sales' | 'designer' | 'production' | 'installation';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string;
  createdBy: string;
  files?: string[];
}

export interface User {
  id?: string;
  name: string;
  email: string;
  employeeId?: string;
  role: 'admin' | 'sales' | 'designer' | 'production' | 'installation';
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  avatar?: string;
  passwordSet?: boolean;
  isTemporary?: boolean;
}

export interface Milestone {
  id?: string;
  projectId: string;
  title: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed'; // Add status for compatibility
  startDate: string;
  dueDate?: string; // Add for compatibility
  completedDate?: Date; // Add for compatibility
  progress?: number; // Add for compatibility
  assignedTo?: string;
  module?: 'production' | 'installation'; // Added to distinguish milestone types
  createdAt: Timestamp;
  updatedAt: Timestamp;
  files?: Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>; // Add for compatibility
  images?: Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
}

// Check if we should use local data (when Firebase is not available)
// Fixed: Only use local data when Firestore is truly unavailable, not as persistent fallback
const shouldUseLocalData = () => {
  // Only use local data in development mode AND when db is not initialized
  // Remove persistent localStorage flag that was causing data override issues
  return isDevelopmentMode && !db;
};

// Helper function to test Firestore connectivity
const testFirestoreConnection = async (): Promise<boolean> => {
  if (!db) return false;

  try {
    // Simple connectivity test - try to read from a collection
    await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    return true;
  } catch (error) {
    console.warn('Firestore connectivity test failed:', error);
    return false;
  }
};

// Helper function to clear any persistent local data flags
const clearLocalDataFlags = () => {
  localStorage.removeItem('useLocalData');
};

// Projects Service
export const projectsService = {
  // Create project with proper status flow (starts in 'sales' status)
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('Creating project in Firestore:', project);
      const docRef = await addDoc(collection(db, 'projects'), {
        ...project,
        status: 'sales', // Always start in sales status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Project created successfully in Firestore:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Firebase createProject failed:', error);
      throw error;
    }
  },

  // Get all projects
  async getProjects(): Promise<Project[]> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    if (shouldUseLocalData()) {
      console.log('Using local data (development mode, Firestore not available)');
      return await localData.getProjects();
    }

    try {
      if (import.meta.env.DEV) {
        console.log('Fetching projects from Firestore...');
      }
      const querySnapshot = await getDocs(
        query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
      );
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      if (import.meta.env.DEV) {
        console.log('Projects fetched successfully from Firestore:', projects.length);
      }
      return projects;
    } catch (error) {
      console.error('Firebase getProjects failed:', error);
      // Only use local data as temporary fallback, don't set persistent flag
      console.warn('Falling back to local data for this operation only');
      return await localData.getProjects();
    }
  },

  // Get project by ID
  async getProject(id: string): Promise<Project | null> {
    // Clear any persistent local data flags
    clearLocalDataFlags();

    if (shouldUseLocalData()) {
      console.log('Using local data (development mode, Firestore not available)');
      return await localData.getProject(id);
    }

    try {
      console.log('Fetching project from Firestore:', id);
      const docSnap = await getDoc(doc(db, 'projects', id));
      if (docSnap.exists()) {
        const project = { id: docSnap.id, ...docSnap.data() } as Project;
        console.log('Project fetched successfully from Firestore:', project);
        return project;
      }
      console.log('Project not found in Firestore:', id);
      return null;
    } catch (error) {
      console.error('Firebase getProject failed:', error);
      // Only use local data as temporary fallback, don't set persistent flag
      console.warn('Falling back to local data for this operation only');
      return await localData.getProject(id);
    }
  },

  // Update project with automatic milestone creation for production
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    // Clear any persistent local data flags
    clearLocalDataFlags();

    if (shouldUseLocalData()) {
      console.log('Using local data (development mode, Firestore not available)');
      await localData.updateProject(id, updates);
      // Auto-create default milestones when project moves to production
      if (updates.status === 'production') {
        await this.createDefaultProductionMilestones(id);
      }
      return;
    }

    try {
      console.log('Updating project in Firestore:', id, updates);

      // Handle nested object updates properly
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Handle nested field updates for Firestore
      Object.keys(updates).forEach(key => {
        if (key.includes('.')) {
          // Handle dot notation for nested updates
          const value = updates[key as keyof Project];
          updateData[key] = value;
          delete updateData[key.replace('.', '')];
        }
      });

      await updateDoc(doc(db, 'projects', id), updateData);
      console.log('Project updated successfully in Firestore');

      // Auto-create default milestones when project moves to production
      if (updates.status === 'production') {
        await this.createDefaultProductionMilestones(id);
      }
    } catch (error) {
      console.error('Firebase updateProject failed:', error);
      // Only use local data as temporary fallback, don't set persistent flag
      console.warn('Falling back to local data for this operation only');
      await localData.updateProject(id, updates);
      if (updates.status === 'production') {
        await this.createDefaultProductionMilestones(id);
      }
    }
  },

  // Create default production milestones
  async createDefaultProductionMilestones(projectId: string): Promise<void> {
    try {
      // Check if default milestones already exist first
      const existingMilestones = await this.getMilestonesByProject(projectId);

      // If there are already milestones for this project, don't create defaults
      if (existingMilestones.length > 0) {
        console.log('Milestones already exist for project:', projectId);
        return;
      }

      const defaultMilestones = [
        {
          projectId,
          title: 'Assembly/Welding',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
          module: 'production' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          projectId,
          title: 'Painting',
          startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks from now
          module: 'production' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      // Create all default milestones
      for (const milestone of defaultMilestones) {
        await addDoc(collection(db, 'milestones'), milestone);
      }

      console.log('Created default production milestones for project:', projectId);
    } catch (error) {
      console.error('Error creating default production milestones:', error);
    }
  },

  // Create default installation milestones
  async createDefaultInstallationMilestones(projectId: string): Promise<void> {
    try {
      // Check if installation milestones already exist
      const existingMilestones = await this.getMilestonesByProject(projectId);
      const installationMilestones = existingMilestones.filter(m => m.module === 'installation');

      // If there are already installation milestones for this project, don't create defaults
      if (installationMilestones.length > 0) {
        console.log('Installation milestones already exist for project:', projectId);
        return;
      }

      const defaultInstallationMilestones = [
        {
          projectId,
          title: 'Site Preparation',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
          module: 'installation' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          projectId,
          title: 'Installation & Setup',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
          module: 'installation' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      // Create all default installation milestones
      for (const milestone of defaultInstallationMilestones) {
        await addDoc(collection(db, 'milestones'), milestone);
      }

      console.log('Created default installation milestones for project:', projectId);
    } catch (error) {
      console.error('Error creating default installation milestones:', error);
    }
  },

  // Get milestones by project (moved from milestonesService for dependency)
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    // Clear any persistent local data flags
    clearLocalDataFlags();

    if (shouldUseLocalData()) {
      console.log('Using local data (development mode, Firestore not available)');
      return await localData.getMilestonesByProject(projectId);
    }

    try {
      console.log('Fetching milestones from Firestore for project:', projectId);

      // First try with orderBy, if it fails due to index, try without orderBy
      let q = query(
        collection(db, 'milestones'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'asc')
      );

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        // If index error, try without orderBy and sort in memory
        console.warn('Index not available, querying without orderBy:', indexError);
        q = query(
          collection(db, 'milestones'),
          where('projectId', '==', projectId)
        );
        querySnapshot = await getDocs(q);
      }

      const milestones = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Milestone));

      console.log('Milestones fetched successfully from Firestore:', milestones.length);

      // Sort in memory if we couldn't use orderBy
      return milestones.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return aDate.getTime() - bDate.getTime();
      });
    } catch (error) {
      console.error('Firebase getMilestonesByProject failed:', error);
      // Only use local data as temporary fallback, don't set persistent flag
      console.warn('Falling back to local data for this operation only');
      return await localData.getMilestonesByProject(projectId);
    }
  },

  // Delete project with comprehensive cleanup
  async deleteProject(id: string): Promise<void> {
    // Clear any persistent local data flags
    clearLocalDataFlags();

    if (shouldUseLocalData()) {
      console.log('Using local data (development mode, Firestore not available)');
      await localData.deleteProject(id);
      return;
    }

    try {
      console.log('Starting comprehensive project deletion for:', id);

      // Use a transaction to ensure all cleanup operations succeed together
      await runTransaction(db, async (transaction) => {
        // 1. Delete the main project document
        const projectRef = doc(db, 'projects', id);
        transaction.delete(projectRef);

        // 2. Get and delete all associated milestones
        const milestonesQuery = query(
          collection(db, 'milestones'),
          where('projectId', '==', id)
        );
        const milestonesSnapshot = await getDocs(milestonesQuery);

        console.log(`Found ${milestonesSnapshot.docs.length} milestones to delete for project ${id}`);
        milestonesSnapshot.docs.forEach(milestoneDoc => {
          transaction.delete(milestoneDoc.ref);
        });

        // 3. Get and delete all document locks for this project
        const locksQuery = query(
          collection(db, 'document_locks'),
          where('documentId', '==', id)
        );
        const locksSnapshot = await getDocs(locksQuery);

        console.log(`Found ${locksSnapshot.docs.length} document locks to delete for project ${id}`);
        locksSnapshot.docs.forEach(lockDoc => {
          transaction.delete(lockDoc.ref);
        });

        // 4. Delete milestone-related locks as well
        milestonesSnapshot.docs.forEach(milestoneDoc => {
          const milestoneId = milestoneDoc.id;
          const milestoneLockRef = doc(db, 'document_locks', `milestone_${milestoneId}`);
          transaction.delete(milestoneLockRef);
        });
      });

      console.log('Project deletion completed successfully:', id);

      // 5. Notify collaborative editing service about the deletion
      await this.notifyProjectDeletion(id);

    } catch (error) {
      console.error('Firebase deleteProject failed:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  },

  // Notify collaborative editing service about project deletion
  async notifyProjectDeletion(projectId: string): Promise<void> {
    try {
      // Import collaborativeService dynamically to avoid circular dependencies
      const { collaborativeService } = await import('./collaborativeService');
      await collaborativeService.handleProjectDeletion(projectId);
    } catch (error) {
      console.warn('Failed to notify collaborative service about project deletion:', error);
      // Don't throw error as the main deletion was successful
    }
  },

  // Get projects by status
  async getProjectsByStatus(status: string): Promise<Project[]> {
    const q = query(
      collection(db, 'projects'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  },

  // Real-time listener for projects
  onProjectsChange(callback: (projects: Project[]) => void) {
    return onSnapshot(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));
        callback(projects);
      }
    );
  }
};

// Complaints Service
export const complaintsService = {
  // Create complaint
  async createComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'complaints'), {
      ...complaint,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Get all complaints
  async getComplaints(): Promise<Complaint[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Complaint));
  },

  // Update complaint
  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<void> {
    await updateDoc(doc(db, 'complaints', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete complaint
  async deleteComplaint(id: string): Promise<void> {
    await deleteDoc(doc(db, 'complaints', id));
  },

  // Real-time listener for complaints
  onComplaintsChange(callback: (complaints: Complaint[]) => void) {
    return onSnapshot(
      query(collection(db, 'complaints'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const complaints = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Complaint));
        callback(complaints);
      }
    );
  }
};

// Users Service
export const usersService = {
  // Create user profile
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Create user document in Firestore
    const docRef = await addDoc(collection(db, 'users'), {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Return the created user with the generated ID
    return {
      id: docRef.id,
      ...user,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
  },

  // Get all users
  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  },

  // Get user by employee ID
  async getUserByEmployeeId(employeeId: string): Promise<User | null> {
    const q = query(collection(db, 'users'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  },

  // Get user by email or employee ID
  async getUserByEmailOrEmployeeId(identifier: string): Promise<User | null> {
    // Try email first
    let user = await this.getUserByEmail(identifier);
    if (user) return user;

    // Try employee ID
    user = await this.getUserByEmployeeId(identifier);
    return user;
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Update last login
  async updateLastLogin(id: string): Promise<void> {
    await updateDoc(doc(db, 'users', id), {
      lastLogin: serverTimestamp()
    });
  },

  // Delete user with comprehensive cleanup
  async deleteUser(id: string): Promise<void> {
    try {
      // First get the user data to find their email
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) {
        console.log('User document not found, nothing to delete');
        return;
      }

      const userData = userDoc.data();
      const email = userData.email;

      if (!email) {
        // Fallback to simple deletion if no email found
        await deleteDoc(doc(db, 'users', id));
        return;
      }

      // Use the comprehensive deletion from adminUserService
      const { adminUserService } = await import('./adminUserService');
      const result = await adminUserService.deleteUserComprehensive(email);

      if (!result.success) {
        console.warn('Comprehensive deletion had issues:', result.message);
        console.warn('Details:', result.details);
        // Still continue with basic deletion as fallback
        await deleteDoc(doc(db, 'users', id));
      }
    } catch (error) {
      console.error('Error in comprehensive user deletion, falling back to basic deletion:', error);
      // Fallback to basic deletion
      await deleteDoc(doc(db, 'users', id));
    }
  }
};

// Milestones Service
export const milestonesService = {
  // Create milestone
  async createMilestone(milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'milestones'), {
      ...milestone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Get milestones by project
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    try {
      // First try with orderBy, if it fails due to index, try without orderBy
      let q = query(
        collection(db, 'milestones'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'asc')
      );

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        // If index error, try without orderBy and sort in memory
        console.warn('Index not available, querying without orderBy:', indexError);
        q = query(
          collection(db, 'milestones'),
          where('projectId', '==', projectId)
        );
        querySnapshot = await getDocs(q);
      }

      const milestones = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Milestone));

      // Sort in memory if we couldn't use orderBy
      return milestones.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return aDate.getTime() - bDate.getTime();
      });
    } catch (error) {
      console.error('Error getting milestones:', error);
      return [];
    }
  },

  // Update milestone
  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<void> {
    await updateDoc(doc(db, 'milestones', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete milestone
  async deleteMilestone(id: string): Promise<void> {
    await deleteDoc(doc(db, 'milestones', id));
  },


};

// File Upload Service
export const fileService = {
  // Upload file
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      console.log('🔥 Firebase Storage upload starting...');
      console.log('📁 Path:', path);
      console.log('📄 File:', file.name, 'Size:', file.size, 'Type:', file.type);

      const storageRef = ref(storage, path);
      console.log('📍 Storage reference created');

      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Upload bytes completed');

      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 Download URL obtained:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('❌ Firebase Storage upload failed:', error);
      throw error;
    }
  },

  // Delete file
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
};

// Statistics Service
export const statisticsService = {
  // Get dashboard statistics
  async getDashboardStats() {
    const [projects, complaints] = await Promise.all([
      projectsService.getProjects(),
      complaintsService.getComplaints()
    ]);

    const activeProjects = projects.filter(p => p.status !== 'completed').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const inProduction = projects.filter(p => p.status === 'production').length;
    const openComplaints = complaints.filter(c => c.status === 'open').length;

    return {
      activeProjects,
      completedProjects,
      inProduction,
      openComplaints,
      totalProjects: projects.length,
      totalComplaints: complaints.length
    };
  }
};

// Initialize service and clear any persistent local data flags
export const initializeFirebaseService = () => {
  if (import.meta.env.DEV) {
    console.log('🔥 Initializing Firebase Service...');
  }

  // Clear any persistent local data flags that might cause data override issues
  clearLocalDataFlags();

  // Test Firestore connectivity if in development mode
  if (isDevelopmentMode && db) {
    testFirestoreConnection().then(isConnected => {
      if (isConnected && import.meta.env.DEV) {
        console.log('✅ Firestore connectivity confirmed - using Firestore as primary data source');
      } else if (!isConnected && import.meta.env.DEV) {
        console.log('⚠️ Firestore connectivity issues detected - will use local fallback when needed');
      }
    }).catch(error => {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Firestore connectivity test failed:', error);
      }
    });
  }

  if (import.meta.env.DEV) {
    console.log('✅ Firebase Service initialized successfully');
  }
};
