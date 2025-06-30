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
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, isDevelopmentMode } from '../config/firebase';
import { localData } from './localData';

// Types
export interface Project {
  id?: string;
  projectName: string;
  description?: string;
  amount?: number;
  deliveryDate: string;
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
    hasFlowedFromPartial?: boolean;
    partialCompletedAt?: Date;
    completedAt?: Date;
    deliveryDate?: Date;
    lastModified: Date;
  };
  productionData?: {
    assignedAt?: Date;
    deliveryDate?: Date;
    completedAt?: Date;
    lastModified: Date;
  };
  installationData?: {
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
  role: 'admin' | 'sales' | 'designer' | 'production' | 'installation';
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  avatar?: string;
}

export interface Milestone {
  id?: string;
  projectId: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate: string;
  completedDate?: string;
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  images?: Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
}

// Check if we should use local data (when Firebase is not available)
const shouldUseLocalData = () => {
  return isDevelopmentMode && (!db || localStorage.getItem('useLocalData') === 'true');
};

// Projects Service
export const projectsService = {
  // Create project with proper status flow (starts in 'sales' status)
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (shouldUseLocalData()) {
      return await localData.createProject(project);
    }

    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...project,
        status: 'sales', // Always start in sales status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.warn('Firebase createProject failed, using local data:', error);
      localStorage.setItem('useLocalData', 'true');
      return await localData.createProject(project);
    }
  },

  // Get all projects
  async getProjects(): Promise<Project[]> {
    if (shouldUseLocalData()) {
      return await localData.getProjects();
    }

    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
    } catch (error) {
      console.warn('Firebase getProjects failed, using local data:', error);
      localStorage.setItem('useLocalData', 'true');
      return await localData.getProjects();
    }
  },

  // Get project by ID
  async getProject(id: string): Promise<Project | null> {
    if (shouldUseLocalData()) {
      return await localData.getProject(id);
    }

    try {
      const docSnap = await getDoc(doc(db, 'projects', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Project;
      }
      return null;
    } catch (error) {
      console.warn('Firebase getProject failed, using local data:', error);
      localStorage.setItem('useLocalData', 'true');
      return await localData.getProject(id);
    }
  },

  // Update project with automatic milestone creation for production
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    if (shouldUseLocalData()) {
      await localData.updateProject(id, updates);
      // Auto-create default milestones when project moves to production
      if (updates.status === 'production') {
        await this.createDefaultProductionMilestones(id);
      }
      return;
    }

    try {
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

      // Auto-create default milestones when project moves to production
      if (updates.status === 'production') {
        await this.createDefaultProductionMilestones(id);
      }
    } catch (error) {
      console.warn('Firebase updateProject failed, using local data:', error);
      localStorage.setItem('useLocalData', 'true');
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
          status: 'pending' as const,
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          projectId,
          title: 'Painting',
          status: 'pending' as const,
          startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks from now
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      // Create all default milestones
      for (const milestone of defaultMilestones) {
        await addDoc(collection(db, 'milestones'), milestone);
      }

      console.log('Created default milestones for project:', projectId);
    } catch (error) {
      console.error('Error creating default production milestones:', error);
    }
  },

  // Get milestones by project (moved from milestonesService for dependency)
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    if (shouldUseLocalData()) {
      return await localData.getMilestonesByProject(projectId);
    }

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
      console.warn('Firebase getMilestonesByProject failed, using local data:', error);
      localStorage.setItem('useLocalData', 'true');
      return await localData.getMilestonesByProject(projectId);
    }
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    await deleteDoc(doc(db, 'projects', id));
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
  // Create user profile with UID as document ID
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    if (!user.uid) {
      throw new Error('User UID is required for user creation');
    }

    // Use setDoc with UID as document ID instead of addDoc
    await setDoc(doc(db, 'users', user.uid), {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return user.uid;
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

  // Update user
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', id), updates);
  },

  // Update last login
  async updateLastLogin(id: string): Promise<void> {
    await updateDoc(doc(db, 'users', id), {
      lastLogin: serverTimestamp()
    });
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

  // Update milestone status
  async updateMilestoneStatus(id: string, status: 'pending' | 'in-progress' | 'completed'): Promise<void> {
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'in-progress') {
      updates.startedAt = serverTimestamp();
    } else if (status === 'completed') {
      updates.completedAt = serverTimestamp();
    }

    await updateDoc(doc(db, 'milestones', id), updates);
  }
};

// File Upload Service
export const fileService = {
  // Upload file
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
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
