// Local Data Service for Development Mode
// Provides fallback data when Firebase is not available
// Production-ready: All arrays are empty - data comes from Firebase or user creation

import type { Project, Complaint, Milestone } from './firebaseService';

// Production-ready empty data arrays
const SAMPLE_PROJECTS: Project[] = [];
const SAMPLE_MILESTONES: Milestone[] = [];
const SAMPLE_COMPLAINTS: Complaint[] = [];

export class LocalDataService {
  private static instance: LocalDataService;
  private projects: Project[] = [...SAMPLE_PROJECTS];
  private milestones: Milestone[] = [...SAMPLE_MILESTONES];
  private complaints: Complaint[] = [...SAMPLE_COMPLAINTS];

  private constructor() {}

  static getInstance(): LocalDataService {
    if (!LocalDataService.instance) {
      LocalDataService.instance = new LocalDataService();
    }
    return LocalDataService.instance;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.projects]), 200);
    });
  }

  async getProject(id: string): Promise<Project | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = this.projects.find(p => p.id === id);
        resolve(project || null);
      }, 150);
    });
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = `local-project-${Date.now()}`;
        const newProject: Project = {
          ...project,
          id,
          status: 'sales',
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any
        };
        this.projects.unshift(newProject);
        resolve(id);
      }, 300);
    });
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
          this.projects[index] = {
            ...this.projects[index],
            ...updates,
            updatedAt: { toDate: () => new Date() } as any
          };
        }
        resolve();
      }, 200);
    });
  }

  async deleteProject(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.projects = this.projects.filter(p => p.id !== id);
        resolve();
      }, 200);
    });
  }

  // Milestones
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projectMilestones = this.milestones.filter(m => m.projectId === projectId);
        resolve([...projectMilestones]);
      }, 150);
    });
  }

  async createMilestone(milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = `local-milestone-${Date.now()}`;
        const newMilestone: Milestone = {
          ...milestone,
          id,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any
        };
        this.milestones.push(newMilestone);
        resolve(id);
      }, 250);
    });
  }

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.milestones.findIndex(m => m.id === id);
        if (index !== -1) {
          this.milestones[index] = {
            ...this.milestones[index],
            ...updates,
            updatedAt: { toDate: () => new Date() } as any
          };
        }
        resolve();
      }, 200);
    });
  }

  async deleteMilestone(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.milestones = this.milestones.filter(m => m.id !== id);
        resolve();
      }, 200);
    });
  }

  // Complaints
  async getComplaints(): Promise<Complaint[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.complaints]), 200);
    });
  }

  async createComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = `local-complaint-${Date.now()}`;
        const newComplaint: Complaint = {
          ...complaint,
          id,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any
        };
        this.complaints.unshift(newComplaint);
        resolve(id);
      }, 300);
    });
  }

  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.complaints.findIndex(c => c.id === id);
        if (index !== -1) {
          this.complaints[index] = {
            ...this.complaints[index],
            ...updates,
            updatedAt: { toDate: () => new Date() } as any
          };
        }
        resolve();
      }, 200);
    });
  }

  async deleteComplaint(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.complaints = this.complaints.filter(c => c.id !== id);
        resolve();
      }, 200);
    });
  }
}

// Export singleton instance
export const localData = LocalDataService.getInstance();