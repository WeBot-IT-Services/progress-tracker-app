import { 
  collection, 
  doc, 
  addDoc, 
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
import { db, storage } from '../config/firebase';

// Types
export interface Project {
  id?: string;
  name: string;
  description?: string;
  amount?: number;
  completionDate: string;
  status: 'DNE' | 'Production' | 'Installation' | 'Completed';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
  files?: string[];
}

export interface Complaint {
  id?: string;
  title: string;
  description: string;
  customerName: string;
  projectId: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
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
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  completedDate?: string;
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Projects Service
export const projectsService = {
  // Create project
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Get all projects
  async getProjects(): Promise<Project[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  },

  // Get project by ID
  async getProject(id: string): Promise<Project | null> {
    const docSnap = await getDoc(doc(db, 'projects', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Project;
    }
    return null;
  },

  // Update project
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    await updateDoc(doc(db, 'projects', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
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
  // Create user profile
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'users'), {
      ...user,
      createdAt: serverTimestamp()
    });
    return docRef.id;
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
    const q = query(
      collection(db, 'milestones'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Milestone));
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

    const activeProjects = projects.filter(p => p.status !== 'Completed').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const inProduction = projects.filter(p => p.status === 'Production').length;
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
