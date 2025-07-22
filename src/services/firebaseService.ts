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
import type { User } from '../types/index';
import { safeToDate } from '../utils/dateUtils';

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
  status?: 'pending' | 'partial' | 'completed';
  assignedAt?: Date;
  completedAt?: Date;
  partialCompletedAt?: Date;
  deliveryDate?: Date;
  lastModified?: Date;
  hasFlowedFromPartial?: boolean;
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
  createdBy?: string; // Employee name (not UID)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  assignedTo?: string; // Employee name (not UID)
  priority?: 'low' | 'medium' | 'high';
  projectType?: string;
  files?: string[];
  designData?: DesignData;
  productionData?: ProductionData;
  installationData?: InstallationData;
  salesData?: SalesData;
  photoMetadata?: PhotoMetadata[];
}

// Use the User type from types/index.ts to avoid conflicts
export type { User } from '../types/index';

export interface MilestoneImage {
  id?: string;
  url: string;
  caption?: string;
  uploadedAt?: Date;
  uploadedBy?: string; // Employee name (not UID)
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
  assignedTo?: string; // Employee name (not UID)
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

  // Delete project with cascade cleanup
  async deleteProject(id: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('🗑️ Starting comprehensive project deletion for:', id);

      // Use a transaction to ensure all deletions succeed or fail together
      await runTransaction(db, async (transaction) => {
        // 1. Get and delete all associated milestones
        const milestonesQuery = query(
          collection(db, 'milestones'),
          where('projectId', '==', id)
        );
        const milestonesSnapshot = await getDocs(milestonesQuery);

        console.log(`Found ${milestonesSnapshot.docs.length} milestones to delete`);
        milestonesSnapshot.docs.forEach(milestoneDoc => {
          transaction.delete(milestoneDoc.ref);
          console.log('Deleting milestone:', milestoneDoc.id);
        });

        // 2. Get and delete any document locks for this project
        try {
          const locksQuery = query(
            collection(db, 'document_locks'),
            where('projectId', '==', id)
          );
          const locksSnapshot = await getDocs(locksQuery);

          console.log(`Found ${locksSnapshot.docs.length} document locks to delete`);
          locksSnapshot.docs.forEach(lockDoc => {
            transaction.delete(lockDoc.ref);
            console.log('Deleting document lock:', lockDoc.id);
          });
        } catch (lockError) {
          console.warn('Error deleting document locks (collection may not exist):', lockError);
        }

        // 3. Delete the main project document
        const projectRef = doc(db, 'projects', id);
        transaction.delete(projectRef);
        console.log('Deleting project document:', id);
      });

      console.log('✅ Project and all associated data deleted successfully');
    } catch (error) {
      console.error('❌ Error during comprehensive project deletion:', error);
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
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to Date objects
          startDate: data.startDate ? safeToDate(data.startDate) : undefined,
          dueDate: data.dueDate ? safeToDate(data.dueDate) : undefined,
          completedDate: data.completedDate ? safeToDate(data.completedDate) : undefined,
          createdAt: data.createdAt ? safeToDate(data.createdAt) : undefined,
          updatedAt: data.updatedAt ? safeToDate(data.updatedAt) : undefined,
        } as Milestone;
      });
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

      // Calculate proper start dates (starting today)
      const baseDate = new Date();
      const paintingStartDate = new Date(baseDate); // Start today
      
      const assemblyStartDate = new Date(baseDate); // Start today

      const defaultMilestones = [
        {
          projectId,
          title: 'Painting',
          description: 'Complete painting process',
          status: 'pending' as const,
          module: 'production' as const,
          startDate: paintingStartDate, // Starts today
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          projectId,
          title: 'Assembly/Welding',
          description: 'Complete assembly and welding processes',
          status: 'pending' as const,
          module: 'production' as const,
          startDate: assemblyStartDate, // Starts today
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
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to Date objects
          startDate: data.startDate ? safeToDate(data.startDate) : undefined,
          dueDate: data.dueDate ? safeToDate(data.dueDate) : undefined,
          completedDate: data.completedDate ? safeToDate(data.completedDate) : undefined,
          createdAt: data.createdAt ? safeToDate(data.createdAt) : undefined,
          updatedAt: data.updatedAt ? safeToDate(data.updatedAt) : undefined,
        } as Milestone;
      });
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
  },

  // Clean up orphaned milestones (milestones whose projects no longer exist)
  async cleanupOrphanedMilestones(): Promise<{ cleaned: number; errors: string[] }> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('🧹 Starting orphaned milestone cleanup...');

      // Get all milestones
      const milestonesSnapshot = await getDocs(collection(db, 'milestones'));
      const milestones = milestonesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${milestones.length} total milestones to check`);

      // Get all existing project IDs
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const existingProjectIds = new Set(projectsSnapshot.docs.map(doc => doc.id));

      console.log(`Found ${existingProjectIds.size} existing projects`);

      // Find orphaned milestones
      const orphanedMilestones = milestones.filter(milestone =>
        (milestone as any).projectId && !existingProjectIds.has((milestone as any).projectId)
      );

      console.log(`Found ${orphanedMilestones.length} orphaned milestones`);

      const errors: string[] = [];
      let cleaned = 0;

      // Delete orphaned milestones in batches
      for (const milestone of orphanedMilestones) {
        try {
          await deleteDoc(doc(db, 'milestones', milestone.id));
          console.log(`Deleted orphaned milestone: ${milestone.id} (project: ${(milestone as any).projectId})`);
          cleaned++;
        } catch (error) {
          const errorMsg = `Failed to delete milestone ${milestone.id}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Cleanup completed: ${cleaned} milestones cleaned, ${errors.length} errors`);

      return { cleaned, errors };
    } catch (error) {
      console.error('❌ Error during orphaned milestone cleanup:', error);
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
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          employeeId: data.employeeId || doc.id,
          id: doc.id,
          ...data,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        } as unknown as User;
      });
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Get user by employee ID (primary method)
  async getUser(employeeId: string): Promise<User> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Try direct lookup first (if employee ID is used as document ID)
      const docRef = doc(db, 'users', employeeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { ...docSnap.data() } as User;
      }

      // Fallback to query-based lookup for backward compatibility
      const querySnapshot = await getDocs(
        query(collection(db, 'users'), where('employeeId', '==', employeeId))
      );

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      return { ...userDoc.data() } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Get user by employee ID (alias for consistency)
  async getUserByEmployeeId(employeeId: string): Promise<User | null> {
    try {
      const user = await this.getUser(employeeId);
      return user;
    } catch (error) {
      // If user not found, return null instead of throwing
      console.log(`User with employee ID ${employeeId} not found`);
      return null;
    }
  },

  // Get user by legacy ID (for backward compatibility)
  async getUserByLegacyId(id: string): Promise<User> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { ...docSnap.data() } as User;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error getting user by legacy ID:', error);
      throw error;
    }
  },

  // Create user (using employee ID as document ID)
  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      if (!user.employeeId) {
        throw new Error('Employee ID is required');
      }

      // Check if user with this employee ID already exists
      const existingUserQuery = query(
        collection(db, 'users'),
        where('employeeId', '==', user.employeeId)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        throw new Error('User with this employee ID already exists');
      }

      // Use employee ID as document ID for easy lookup
      const docRef = doc(db, 'users', user.employeeId);
      await setDoc(docRef, {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return user.employeeId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user by employee ID
  async updateUser(employeeId: string, updates: Partial<User>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Try direct update first (if employee ID is used as document ID)
      const docRef = doc(db, 'users', employeeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        return;
      }

      // Fallback to query-based update for backward compatibility
      const querySnapshot = await getDocs(
        query(collection(db, 'users'), where('employeeId', '==', employeeId))
      );

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      await updateDoc(userDoc.ref, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Update user by legacy ID (for backward compatibility)
  async updateUserByLegacyId(id: string, updates: Partial<User>): Promise<void> {
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
      console.error('Error updating user by legacy ID:', error);
      throw error;
    }
  },

  // Delete user by employee ID
  async deleteUser(employeeId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Try direct deletion first (if employee ID is used as document ID)
      const docRef = doc(db, 'users', employeeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await deleteDoc(docRef);
        return;
      }

      // Fallback to query-based deletion for backward compatibility
      const querySnapshot = await getDocs(
        query(collection(db, 'users'), where('employeeId', '==', employeeId))
      );

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      await deleteDoc(userDoc.ref);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Delete user by legacy ID (for backward compatibility)
  async deleteUserByLegacyId(id: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(db, 'users', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user by legacy ID:', error);
      throw error;
    }
  },

  // Note: updateLastLogin function moved to end of service for better error handling

  // Create user with password hash
  async createUserWithPassword(userData: Omit<User, 'createdAt' | 'updatedAt'>, password: string): Promise<string> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      if (!userData.employeeId) {
        throw new Error('Employee ID is required');
      }

      // Import password utilities
      const { hashPassword } = await import('../utils/passwordUtils');

      // Hash the password
      const passwordHash = await hashPassword(password);

      // Check if user with this employee ID already exists
      const existingUserQuery = query(
        collection(db, 'users'),
        where('employeeId', '==', userData.employeeId)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        throw new Error('User with this employee ID already exists');
      }

      // Create user with password hash
      const userWithPassword = {
        ...userData,
        passwordHash,
        passwordSet: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Use employee ID as document ID for easy lookup
      const docRef = doc(db, 'users', userData.employeeId);
      await setDoc(docRef, userWithPassword);

      return userData.employeeId;
    } catch (error) {
      console.error('Error creating user with password:', error);
      throw error;
    }
  },

  // Update user password
  async updateUserPassword(employeeId: string, newPassword: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Import password utilities
      const { hashPassword } = await import('../utils/passwordUtils');

      // Hash the new password
      const passwordHash = await hashPassword(newPassword);

      await this.updateUser(employeeId, {
        passwordHash,
        passwordSet: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  },

  // Note: getUserByEmployeeId is implemented above as an alias to getUser

  // Update last login (robust version that finds user by employee ID)
  async updateLastLogin(employeeIdOrUserId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      console.log(`🔄 Updating last login for: ${employeeIdOrUserId}`);

      // First, try to find the user by employee ID
      let userDocRef = null;
      let userDocId = null;

      try {
        // Try to get user by employee ID first
        const user = await this.getUserByEmployeeId(employeeIdOrUserId);
        if (user && user.id) {
          userDocId = user.id;
          userDocRef = doc(db, 'users', user.id);
          console.log(`   📍 Found user document by employee ID: ${user.id}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Could not find user by employee ID, trying direct document access...`);
      }

      // If not found by employee ID, try direct document access
      if (!userDocRef) {
        userDocId = employeeIdOrUserId;
        userDocRef = doc(db, 'users', employeeIdOrUserId);
        console.log(`   📍 Using direct document access: ${employeeIdOrUserId}`);
      }

      // Update the document
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`   ✅ Last login updated successfully for document: ${userDocId}`);
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for last login update failure - it's not critical
      console.log('   ⚠️ Last login update failed, but continuing with authentication...');
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
        user: {
          employeeId: userData.employeeId || userDoc.id,
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt || new Date(),
          updatedAt: userData.updatedAt || new Date()
        } as User
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
