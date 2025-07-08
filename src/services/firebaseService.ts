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

// Types
export interface DesignData {
  status: 'pending' | 'partial' | 'completed';
  assignedAt?: Date;
  completedAt?: Date;
  partialCompletedAt?: Date;
  deliveryDate?: Date;
  lastModified?: Date;
  hasFlowedFromPartial?: boolean;
}

export interface ProductionData {
  assignedAt?: Date;
  completedAt?: Date;
  deliveryDate?: Date;
  lastModified?: Date;
  milestones?: Milestone[];
}

export interface InstallationData {
  assignedAt?: Date;
  completedAt?: Date;
  deliveryDate?: Date;
  lastModified?: Date;
  notes?: string;
  milestoneProgress?: Record<string, boolean>;
}

export interface SalesData {
  assignedAt?: Date;
  completedAt?: Date;
  deliveryDate?: Date;
  lastModified?: Date;
}

export interface PhotoMetadata {
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Project {
  id?: string;
  projectName: string;
  name?: string;
  description?: string;
  amount: number;
  estimatedCompletionDate: Date;
  deliveryDate?: string;
  completionDate?: string;
  status: ProjectStatus;
  progress?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  projectType?: string;
  files?: string[];
  designData?: DesignData;
  productionData?: ProductionData;
  installationData?: InstallationData;
  salesData?: SalesData;
  photoMetadata?: PhotoMetadata[];
}

export interface User {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'designer' | 'production' | 'installation';
  employeeId?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isTemporary?: boolean;
  passwordSet?: boolean;
}

export interface MilestoneImage {
  id?: string;
  url: string;
  caption?: string;
  uploadedAt?: Date;
  uploadedBy?: string;
}

export interface Milestone {
  id?: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate?: Date;
  completionDate?: Date;
  completedDate?: Date; // Legacy support
  dueDate?: Date;
  progress?: number;
  assignedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
  images?: string[];
  files?: string[];
  module?: 'production' | 'installation';
}

export interface Complaint {
  id?: string;
  title: string;
  description: string;
  customerName: string;
  projectId?: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  department: 'sales' | 'designer' | 'production' | 'installation';
  createdBy?: string;
  assignedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
  images?: string[];
  files?: string[];
}

export type ProjectStatus = 'sales' | 'design' | 'production' | 'installation' | 'completed' | 'cancelled' | 'dne';

export interface CompletionPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt?: Date;
  uploadedBy?: string;
}

export interface InstallationPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt?: Date;
  uploadedBy?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

// Projects Service - Firebase Only
export const projectsService = {
  // Create project
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('Creating project in Firestore:', project);
      const docRef = await addDoc(collection(db, 'projects'), {
        ...project,
        status: 'sales',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Project created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Get all projects
  async getProjects(): Promise<Project[]> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  },

  // Get project by ID
  async getProject(id: string): Promise<Project> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'projects', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Project;
      } else {
        throw new Error('Project not found');
      }
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  },

  // Update project
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'projects', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'projects', id);
      await deleteDoc(docRef);
      console.log('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Get projects by status
  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'projects'),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
    } catch (error) {
      console.error('Error getting projects by status:', error);
      throw error;
    }
  },

  // Real-time project listener
  subscribeToProjects(callback: (projects: Project[]) => void): () => void {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    return onSnapshot(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      (querySnapshot) => {
        const projects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        callback(projects);
      },
      (error) => {
        console.error('Error in project subscription:', error);
      }
    );
  },

  // Get milestones by project
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'milestones'),
          where('projectId', '==', projectId),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Milestone[];
    } catch (error) {
      console.error('Error getting milestones by project:', error);
      throw error;
    }
  },

  // Create default production milestones
  async createDefaultProductionMilestones(projectId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Check if default milestones already exist to prevent duplicates
      const existingMilestones = await milestonesService.getMilestonesByProject(projectId);
      const productionMilestones = existingMilestones.filter(m => m.module === 'production' || !m.module);
      
      if (productionMilestones.length > 0) {
        console.log(`Production milestones already exist for project: ${projectId} (found ${productionMilestones.length})`);
        return;
      }

      // Calculate proper start dates (today + 1 week intervals)
      const baseDate = new Date();
      const paintingStartDate = new Date(baseDate);
      paintingStartDate.setDate(baseDate.getDate() + 7); // Start in 1 week
      
      const assemblyStartDate = new Date(paintingStartDate);
      assemblyStartDate.setDate(paintingStartDate.getDate() + 14); // Start 2 weeks after painting

      const defaultMilestones = [
        {
          projectId,
          title: 'Painting',
          description: 'Complete painting process',
          status: 'pending' as const,
          module: 'production' as const,
          startDate: paintingStartDate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          projectId,
          title: 'Assembly/Welding',
          description: 'Complete assembly and welding processes',
          status: 'pending' as const,
          module: 'production' as const,
          startDate: assemblyStartDate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      const promises = defaultMilestones.map(milestone => 
        addDoc(collection(db, 'milestones'), milestone)
      );

      await Promise.all(promises);
      console.log('Default production milestones created successfully');
    } catch (error) {
      console.error('Error creating default production milestones:', error);
      throw error;
    }
  },

  // Legacy method support
  onProjectsChange: undefined as ((callback: (projects: Project[]) => void) => () => void) | undefined,
};

// Milestones Service
export const milestonesService = {
  // Get milestones by project ID
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'milestones'),
          where('projectId', '==', projectId),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Milestone[];
    } catch (error) {
      console.error('Error getting milestones:', error);
      return []; // Return empty array if no milestones found
    }
  },

  // Create milestone
  async createMilestone(milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = await addDoc(collection(db, 'milestones'), {
        ...milestone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  },

  // Update milestone
  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'milestones', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  },

  // Delete milestone
  async deleteMilestone(id: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'milestones', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }
};

// Users Service
export const usersService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUser(id: string): Promise<User> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Create user
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'users', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get user by employee ID
  async getUserByEmployeeId(employeeId: string): Promise<User | null> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'users'), where('employeeId', '==', employeeId))
      );
      
      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
      console.error('Error getting user by employee ID:', error);
      throw error;
    }
  },

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  },
};

// Complaints Service
export const complaintsService = {
  // Get all complaints
  async getComplaints(): Promise<Complaint[]> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];
    } catch (error) {
      console.error('Error getting complaints:', error);
      throw error;
    }
  },

  // Create complaint
  async createComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = await addDoc(collection(db, 'complaints'), {
        ...complaint,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  },

  // Update complaint
  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'complaints', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  },

  // Delete complaint
  async deleteComplaint(id: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'complaints', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  }
};

// Statistics Service
export const statisticsService = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<{
    activeProjects: number;
    completedProjects: number;
    inProduction: number;
    openComplaints: number;
    totalProjects: number;
    totalComplaints: number;
  }> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const [projectsSnapshot, complaintsSnapshot] = await Promise.all([
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'complaints'))
      ]);

      const projects = projectsSnapshot.docs.map(doc => doc.data() as Project);
      const complaints = complaintsSnapshot.docs.map(doc => doc.data() as Complaint);

      return {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        inProduction: projects.filter(p => p.status === 'production').length,
        totalComplaints: complaints.length,
        openComplaints: complaints.filter(c => c.status === 'open').length
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
};

// File Service
export const fileService = {
  // Upload file
  async uploadFile(file: File, path: string): Promise<string> {
    if (!storage) {
      throw new Error('Firebase storage not initialized');
    }

    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Delete file
  async deleteFile(path: string): Promise<void> {
    if (!storage) {
      throw new Error('Firebase storage not initialized');
    }

    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};

// Workflow Service
export const workflowService = {
  // Check if transition is allowed
  canTransitionTo(currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean {
    const transitions: Record<ProjectStatus, ProjectStatus[]> = {
      sales: ['design', 'cancelled'],
      design: ['production', 'installation', 'cancelled'],
      production: ['installation', 'cancelled'],
      installation: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      dne: ['design', 'cancelled']
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  },

  // Get next possible statuses
  getNextStatuses(currentStatus: ProjectStatus): ProjectStatus[] {
    const transitions: Record<ProjectStatus, ProjectStatus[]> = {
      sales: ['design', 'cancelled'],
      design: ['production', 'installation', 'cancelled'],
      production: ['installation', 'cancelled'],
      installation: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      dne: ['design', 'cancelled']
    };

    return transitions[currentStatus] || [];
  },

  // Update project status
  async updateProjectStatus(project: Project, newStatus: ProjectStatus): Promise<void> {
    if (!project.id) {
      throw new Error('Project ID is required');
    }

    if (!this.canTransitionTo(project.status, newStatus)) {
      throw new Error(`Cannot transition from ${project.status} to ${newStatus}`);
    }

    await projectsService.updateProject(project.id, {
      status: newStatus,
      updatedAt: new Date()
    });
  },

  // Get progress percentage
  getProgressPercentage(status: ProjectStatus): number {
    const progressMap: Record<ProjectStatus, number> = {
      sales: 20,
      design: 40,
      production: 60,
      installation: 80,
      completed: 100,
      cancelled: 0,
      dne: 30
    };

    return progressMap[status] || 0;
  },

  // Get status info
  getStatusInfo(status: ProjectStatus): { color: string; label: string; description: string } {
    const statusInfo: Record<ProjectStatus, { color: string; label: string; description: string }> = {
      sales: { color: 'bg-green-100 text-green-800', label: 'Sales', description: 'Project in sales phase' },
      design: { color: 'bg-blue-100 text-blue-800', label: 'Design', description: 'Project in design phase' },
      production: { color: 'bg-orange-100 text-orange-800', label: 'Production', description: 'Project in production phase' },
      installation: { color: 'bg-purple-100 text-purple-800', label: 'Installation', description: 'Project in installation phase' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed', description: 'Project completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', description: 'Project cancelled' },
      dne: { color: 'bg-yellow-100 text-yellow-800', label: 'DNE', description: 'Project does not exist or pending' }
    };

    return statusInfo[status];
  },

  // Transition methods for specific workflows
  async transitionDesignToProduction(projectId: string, deliveryDate?: string): Promise<void> {
    const project = await projectsService.getProject(projectId);
    
    if (!this.canTransitionTo(project.status, 'production')) {
      throw new Error('Cannot transition to production from current status');
    }

    await projectsService.updateProject(projectId, {
      status: 'production',
      deliveryDate,
      productionData: {
        assignedAt: new Date(),
        lastModified: new Date()
      }
    });
  },

  async transitionDesignToInstallation(projectId: string, deliveryDate?: string): Promise<void> {
    const project = await projectsService.getProject(projectId);
    
    if (!this.canTransitionTo(project.status, 'installation')) {
      throw new Error('Cannot transition to installation from current status');
    }

    await projectsService.updateProject(projectId, {
      status: 'installation',
      deliveryDate,
      installationData: {
        assignedAt: new Date(),
        lastModified: new Date()
      }
    });
  },

  async transitionProductionToInstallation(projectId: string, deliveryDate?: string): Promise<void> {
    const project = await projectsService.getProject(projectId);
    
    if (!this.canTransitionTo(project.status, 'installation')) {
      throw new Error('Cannot transition to installation from current status');
    }

    await projectsService.updateProject(projectId, {
      status: 'installation',
      deliveryDate,
      installationData: {
        assignedAt: new Date(),
        lastModified: new Date()
      }
    });
  },

  async transitionInstallationToCompleted(projectId: string, deliveryDate?: string): Promise<void> {
    const project = await projectsService.getProject(projectId);
    
    if (!this.canTransitionTo(project.status, 'completed')) {
      throw new Error('Cannot transition to completed from current status');
    }

    await projectsService.updateProject(projectId, {
      status: 'completed',
      deliveryDate,
      completionDate: new Date().toISOString(),
      installationData: {
        ...project.installationData,
        completedAt: new Date()
      }
    });
  },
};

// Admin User Service
export const adminUserService = {
  // Check password status
  async checkPasswordStatus(email: string): Promise<{
    exists: boolean;
    needsPassword: boolean;
    message: string;
    isTemporary?: boolean;
    passwordSet?: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'users'), where('email', '==', email))
      );

      if (querySnapshot.empty) {
        return {
          exists: false,
          needsPassword: false,
          message: 'User not found'
        };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      return {
        exists: true,
        needsPassword: !userData.passwordSet,
        message: userData.passwordSet ? 'Password already set' : 'Password needs to be set',
        isTemporary: userData.isTemporary,
        passwordSet: userData.passwordSet,
        user: { id: userDoc.id, ...userData }
      };
    } catch (error) {
      console.error('Error checking password status:', error);
      return {
        exists: false,
        needsPassword: false,
        message: 'Error checking password status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Update password status
  async updatePasswordStatus(userId: string, passwordSet: boolean = true, isTemporary: boolean = false): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        passwordSet,
        isTemporary,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating password status:', error);
      throw error;
    }
  }
};

// Initialize Firebase service
export const initializeFirebaseService = () => {
  console.log('Firebase service initialized');
  
  if (isDevelopmentMode) {
    console.log('Development mode detected');
  }
  
  if (!db) {
    console.warn('Firestore not initialized');
  }
  
  if (!storage) {
    console.warn('Firebase Storage not initialized');
  }
};

// Export all services
export {
  projectsService as default
};
