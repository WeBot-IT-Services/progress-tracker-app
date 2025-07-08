// Workflow Service - Handles status transitions and business logic
import type { Project, ProjectStatus } from '../types';

export const workflowService = {
  // Validate status transitions
  canTransitionTo: (currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean => {
    const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      'sales': ['dne', 'production'],
      'dne': ['production', 'sales'],
      'production': ['installation', 'dne'],
      'installation': ['completed', 'production'],
      'completed': [] // No transitions from completed
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  },

  // Get next available statuses
  getNextStatuses: (currentStatus: ProjectStatus): ProjectStatus[] => {
    const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      'sales': ['dne', 'production'],
      'dne': ['production', 'sales'],
      'production': ['installation', 'dne'],
      'installation': ['completed', 'production'],
      'completed': []
    };

    return allowedTransitions[currentStatus] || [];
  },

  // Update project status with validation
  updateProjectStatus: async (project: Project, newStatus: ProjectStatus): Promise<Project> => {
    if (!workflowService.canTransitionTo(project.status, newStatus)) {
      throw new Error(`Cannot transition from ${project.status} to ${newStatus}`);
    }

    const updatedProject = {
      ...project,
      status: newStatus,
      updatedAt: new Date()
    };

    // Add any status-specific logic here
    switch (newStatus) {
      case 'production':
        // Initialize production data if needed
        break;
      case 'installation':
        // Initialize installation data if needed
        break;
      case 'completed':
        // Set completion date
        updatedProject.completionDate = new Date();
        break;
    }

    return updatedProject;
  },

  // Get workflow progress percentage
  getProgressPercentage: (status: ProjectStatus): number => {
    const progressMap: Record<ProjectStatus, number> = {
      'sales': 0,
      'dne': 25,
      'production': 50,
      'installation': 75,
      'completed': 100
    };

    return progressMap[status] || 0;
  },

  // Get status display information
  getStatusInfo: (status: ProjectStatus) => {
    const statusInfo: Record<ProjectStatus, { label: string; color: string; icon: string }> = {
      'sales': { label: 'Sales', color: 'blue', icon: '💼' },
      'dne': { label: 'Design & Engineering', color: 'purple', icon: '🎨' },
      'production': { label: 'Production', color: 'green', icon: '🏭' },
      'installation': { label: 'Installation', color: 'orange', icon: '🔧' },
      'completed': { label: 'Completed', color: 'gray', icon: '✅' }
    };

    return statusInfo[status] || { label: 'Unknown', color: 'gray', icon: '❓' };
  },

  // Calculate estimated completion date based on status and current date
  calculateEstimatedCompletion: (status: ProjectStatus, baseDate: Date = new Date()): Date => {
    const daysToAdd: Record<ProjectStatus, number> = {
      'sales': 60, // 2 months
      'dne': 45, // 1.5 months
      'production': 30, // 1 month
      'installation': 14, // 2 weeks
      'completed': 0
    };

    const estimatedDate = new Date(baseDate);
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd[status]);
    return estimatedDate;
  }
};

export default workflowService;
