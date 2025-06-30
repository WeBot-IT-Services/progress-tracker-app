/**
 * Offline-First Service Wrapper
 * Provides offline-first functionality for all data operations
 */

import { projectsService } from './firebaseService';
import { addToSyncQueue, saveProject, getProject, isOnline } from './offlineStorage';
import { getCurrentUser } from '../contexts/AuthContext';

interface OfflineFirstOptions {
  priority?: 'low' | 'medium' | 'high';
  conflictResolution?: 'client-wins' | 'server-wins' | 'merge' | 'manual';
}

class OfflineFirstService {
  // Project operations
  async createProject(projectData: any, options: OfflineFirstOptions = {}): Promise<string> {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      if (isOnline()) {
        // Online: Create directly
        const projectId = await projectsService.createProject(projectData);
        
        // Cache locally
        await saveProject({
          id: projectId,
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return projectId;
      } else {
        // Offline: Generate temporary ID and queue for sync
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const projectWithId = {
          id: tempId,
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date(),
          _isTemporary: true
        };
        
        // Save locally
        await saveProject(projectWithId);
        
        // Queue for sync
        await addToSyncQueue({
          type: 'CREATE',
          collection: 'projects',
          data: projectWithId,
          userId: user.uid,
          priority: options.priority || 'medium',
          conflictResolution: options.conflictResolution || 'client-wins'
        });
        
        return tempId;
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: any, options: OfflineFirstOptions = {}): Promise<void> {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Get current project data
      let currentProject = await getProject(projectId);
      
      if (!currentProject && isOnline()) {
        // Try to fetch from server if not cached
        currentProject = await projectsService.getProject(projectId);
        if (currentProject) {
          await saveProject(currentProject);
        }
      }

      if (!currentProject) {
        throw new Error('Project not found');
      }

      const updatedProject = {
        ...currentProject,
        ...updates,
        updatedAt: new Date()
      };

      // Always save locally first
      await saveProject(updatedProject);

      if (isOnline()) {
        // Online: Update server immediately
        try {
          await projectsService.updateProject(projectId, updates);
        } catch (error) {
          console.warn('Failed to update server, queuing for sync:', error);
          // Queue for sync if server update fails
          await addToSyncQueue({
            type: 'UPDATE',
            collection: 'projects',
            data: updatedProject,
            userId: user.uid,
            priority: options.priority || 'medium',
            conflictResolution: options.conflictResolution || 'merge'
          });
        }
      } else {
        // Offline: Queue for sync
        await addToSyncQueue({
          type: 'UPDATE',
          collection: 'projects',
          data: updatedProject,
          userId: user.uid,
          priority: options.priority || 'medium',
          conflictResolution: options.conflictResolution || 'merge'
        });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<any | null> {
    try {
      // Always try local cache first
      let project = await getProject(projectId);
      
      if (project) {
        return project;
      }

      // If not in cache and online, fetch from server
      if (isOnline()) {
        try {
          project = await projectsService.getProject(projectId);
          if (project) {
            // Cache for offline use
            await saveProject(project);
            return project;
          }
        } catch (error) {
          console.warn('Failed to fetch project from server:', error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  async deleteProject(projectId: string, options: OfflineFirstOptions = {}): Promise<void> {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      if (isOnline()) {
        // Online: Delete from server
        try {
          await projectsService.deleteProject(projectId);
          // Mark as deleted locally
          await this.markProjectAsDeleted(projectId);
        } catch (error) {
          console.warn('Failed to delete from server, queuing for sync:', error);
          // Queue for sync if server delete fails
          await addToSyncQueue({
            type: 'DELETE',
            collection: 'projects',
            data: { id: projectId },
            userId: user.uid,
            priority: options.priority || 'high',
            conflictResolution: options.conflictResolution || 'client-wins'
          });
        }
      } else {
        // Offline: Mark as deleted and queue for sync
        await this.markProjectAsDeleted(projectId);
        await addToSyncQueue({
          type: 'DELETE',
          collection: 'projects',
          data: { id: projectId },
          userId: user.uid,
          priority: options.priority || 'high',
          conflictResolution: options.conflictResolution || 'client-wins'
        });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  private async markProjectAsDeleted(projectId: string): Promise<void> {
    const project = await getProject(projectId);
    if (project) {
      await saveProject({
        ...project,
        _isDeleted: true,
        deletedAt: new Date()
      });
    }
  }

  // Milestone operations
  async createMilestone(projectId: string, milestoneData: any, options: OfflineFirstOptions = {}): Promise<string> {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      if (isOnline()) {
        // Online: Create directly
        return await projectsService.createMilestone(projectId, milestoneData);
      } else {
        // Offline: Generate temporary ID and queue for sync
        const tempId = `temp_milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const milestoneWithId = {
          id: tempId,
          projectId,
          ...milestoneData,
          createdAt: new Date(),
          updatedAt: new Date(),
          _isTemporary: true
        };
        
        // Queue for sync
        await addToSyncQueue({
          type: 'CREATE',
          collection: 'milestones',
          data: milestoneWithId,
          userId: user.uid,
          priority: options.priority || 'medium',
          conflictResolution: options.conflictResolution || 'client-wins'
        });
        
        return tempId;
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  async updateMilestone(milestoneId: string, updates: any, options: OfflineFirstOptions = {}): Promise<void> {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      if (isOnline()) {
        // Online: Update server immediately
        try {
          await projectsService.updateMilestone(milestoneId, updates);
        } catch (error) {
          console.warn('Failed to update milestone on server, queuing for sync:', error);
          // Queue for sync if server update fails
          await addToSyncQueue({
            type: 'UPDATE',
            collection: 'milestones',
            data: { id: milestoneId, ...updates, updatedAt: new Date() },
            userId: user.uid,
            priority: options.priority || 'medium',
            conflictResolution: options.conflictResolution || 'merge'
          });
        }
      } else {
        // Offline: Queue for sync
        await addToSyncQueue({
          type: 'UPDATE',
          collection: 'milestones',
          data: { id: milestoneId, ...updates, updatedAt: new Date() },
          userId: user.uid,
          priority: options.priority || 'medium',
          conflictResolution: options.conflictResolution || 'merge'
        });
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  // File upload operations
  async uploadFile(file: File, path: string, options: OfflineFirstOptions = {}): Promise<string> {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      if (isOnline()) {
        // Online: Upload directly
        return await projectsService.uploadFile(file, path);
      } else {
        // Offline: Store file data and queue for sync
        const tempUrl = `temp_file_${Date.now()}_${file.name}`;
        
        // Convert file to base64 for offline storage
        const fileData = await this.fileToBase64(file);
        
        await addToSyncQueue({
          type: 'CREATE',
          collection: 'files',
          data: {
            tempUrl,
            fileName: file.name,
            fileData,
            path,
            size: file.size,
            type: file.type
          },
          userId: user.uid,
          priority: options.priority || 'low',
          conflictResolution: options.conflictResolution || 'client-wins'
        });
        
        return tempUrl;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

export const offlineFirstService = new OfflineFirstService();
