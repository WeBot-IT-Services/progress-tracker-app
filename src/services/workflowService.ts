// Workflow Service - Handles automatic project transitions between modules
import { projectsService, type Project } from './firebaseService';

export interface WorkflowTransition {
  fromStatus: string;
  toStatus: string;
  deliveryDate?: Date;
  reason: string;
}

export const workflowService = {
  // Sales → Design (Automatic after project creation)
  async transitionSalesToDesign(projectId: string, deliveryDate?: Date): Promise<void> {
    try {
      const updates: Partial<Project> = {
        status: 'dne',
        progress: 25,
        salesData: {
          deliveryDate: deliveryDate || new Date(),
          completedAt: new Date(),
          lastModified: new Date()
        },
        designData: {
          status: 'pending',
          lastModified: new Date(),
          hasFlowedFromPartial: false
        }
      };

      await projectsService.updateProject(projectId, updates);
      console.log(`Project ${projectId} automatically transitioned from Sales to Design`);
    } catch (error) {
      console.error('Error transitioning Sales to Design:', error);
      throw error;
    }
  },

  // Design → Production (When Design status is "Partial" or "Completed")
  async transitionDesignToProduction(projectId: string, deliveryDate?: Date): Promise<void> {
    try {
      const project = await projectsService.getProject(projectId);
      if (!project) throw new Error('Project not found');

      // Preserve the current design status and data - don't override what was just set
      const currentDesignData = project.designData || {};

      const updates: Partial<Project> = {
        status: 'production',
        progress: 50,
        designData: {
          ...currentDesignData,
          // Only update deliveryDate if not already set
          deliveryDate: currentDesignData.deliveryDate || deliveryDate || new Date(),
          lastModified: new Date()
        },
        productionData: {
          assignedAt: new Date(),
          lastModified: new Date()
        }
      };

      await projectsService.updateProject(projectId, updates);

      // Create default production milestones automatically
      try {
        await projectsService.createDefaultProductionMilestones(projectId);
        console.log(`Default production milestones created for project ${projectId}`);
      } catch (error) {
        console.error('Error creating default production milestones:', error);
        // Don't fail the transition if milestone creation fails
      }

      console.log(`Project ${projectId} automatically transitioned from Design to Production (design status: ${currentDesignData.status})`);
    } catch (error) {
      console.error('Error transitioning Design to Production:', error);
      throw error;
    }
  },

  // Design → Installation (When Design status is "Partial" or "Completed")
  async transitionDesignToInstallation(projectId: string, deliveryDate?: Date): Promise<void> {
    try {
      console.log(`🔄 Starting Design → Installation transition for project ${projectId}`);
      const project = await projectsService.getProject(projectId);
      if (!project) {
        console.error(`❌ Project ${projectId} not found`);
        throw new Error('Project not found');
      }

      console.log(`📋 Current project status: ${project.status}`);
      console.log(`📋 Current design data:`, project.designData);

      // Preserve the current design status and data - don't override what was just set
      const currentDesignData = project.designData || {};

      const updates: Partial<Project> = {
        status: 'installation',
        progress: 75,
        designData: {
          ...currentDesignData,
          // Only update deliveryDate if not already set
          deliveryDate: currentDesignData.deliveryDate || deliveryDate || new Date(),
          lastModified: new Date()
        },
        installationData: {
          milestoneProgress: {},
          lastModified: new Date()
        }
      };

      console.log(`📝 Updating project with:`, updates);
      await projectsService.updateProject(projectId, updates);
      console.log(`✅ Project ${projectId} successfully transitioned from Design to Installation (design status: ${currentDesignData.status})`);
    } catch (error) {
      console.error('❌ Error transitioning Design to Installation:', error);
      throw error;
    }
  },

  // Production → Installation
  async transitionProductionToInstallation(projectId: string, deliveryDate?: Date): Promise<void> {
    try {
      const project = await projectsService.getProject(projectId);
      if (!project) throw new Error('Project not found');

      const updates: Partial<Project> = {
        status: 'installation',
        progress: 75,
        productionData: {
          ...project.productionData,
          deliveryDate: deliveryDate || new Date(),
          completedAt: new Date(),
          lastModified: new Date()
        },
        installationData: {
          milestoneProgress: {},
          lastModified: new Date()
        }
      };

      await projectsService.updateProject(projectId, updates);
      console.log(`Project ${projectId} automatically transitioned from Production to Installation`);
    } catch (error) {
      console.error('Error transitioning Production to Installation:', error);
      throw error;
    }
  },

  // Installation → Completed (with validation)
  async transitionInstallationToCompleted(projectId: string, deliveryDate?: Date): Promise<void> {
    try {
      const project = await projectsService.getProject(projectId);
      if (!project) throw new Error('Project not found');

      // Validate all milestones are completed
      const milestones = await projectsService.getMilestonesByProject(projectId);
      const incompleteMilestones = milestones.filter(m => m.status !== 'completed');

      if (incompleteMilestones.length > 0) {
        const incompleteList = incompleteMilestones.map(m => m.title).join(', ');
        throw new Error(`Cannot complete project. The following milestones are not completed: ${incompleteList}`);
      }

      const updates: Partial<Project> = {
        status: 'completed',
        progress: 100,
        installationData: {
          ...project.installationData,
          deliveryDate: deliveryDate || new Date(),
          completedAt: new Date(),
          lastModified: new Date()
        }
      };

      await projectsService.updateProject(projectId, updates);
      console.log(`Project ${projectId} automatically transitioned from Installation to Completed`);
    } catch (error) {
      console.error('Error transitioning Installation to Completed:', error);
      throw error;
    }
  },

  // Move Design project to history (when status is "Completed")
  async moveDesignToHistory(projectId: string): Promise<void> {
    try {
      const project = await projectsService.getProject(projectId);
      if (!project) throw new Error('Project not found');

      // Mark design as completed and moved to history
      const updates: Partial<Project> = {
        designData: {
          ...project.designData,
          status: 'completed',
          completedAt: new Date(),
          lastModified: new Date()
        }
      };

      await projectsService.updateProject(projectId, updates);
      console.log(`Project ${projectId} moved to Design history`);
    } catch (error) {
      console.error('Error moving Design to history:', error);
      throw error;
    }
  },

  // Get workflow history for a project
  async getProjectWorkflowHistory(projectId: string): Promise<WorkflowTransition[]> {
    try {
      const project = await projectsService.getProject(projectId);
      if (!project) return [];

      const history: WorkflowTransition[] = [];

      // Sales completion
      if (project.salesData?.completedAt) {
        history.push({
          fromStatus: 'sales',
          toStatus: 'dne',
          deliveryDate: project.salesData.deliveryDate,
          reason: 'Automatic transition after sales completion'
        });
      }

      // Design transitions
      if (project.designData?.deliveryDate) {
        const nextStatus = project.status === 'production' ? 'production' : 'installation';
        history.push({
          fromStatus: 'dne',
          toStatus: nextStatus,
          deliveryDate: project.designData.deliveryDate,
          reason: `Design ${project.designData.status} - automatic transition`
        });
      }

      // Production completion
      if (project.productionData?.completedAt) {
        history.push({
          fromStatus: 'production',
          toStatus: 'installation',
          deliveryDate: project.productionData.deliveryDate,
          reason: 'Production completed - automatic transition'
        });
      }

      // Installation completion
      if (project.installationData?.completedAt) {
        history.push({
          fromStatus: 'installation',
          toStatus: 'completed',
          deliveryDate: project.installationData.deliveryDate,
          reason: 'Installation completed - automatic transition'
        });
      }

      return history.sort((a, b) => {
        const aDate = a.deliveryDate || new Date(0);
        const bDate = b.deliveryDate || new Date(0);
        return aDate.getTime() - bDate.getTime();
      });
    } catch (error) {
      console.error('Error getting workflow history:', error);
      return [];
    }
  }
};
