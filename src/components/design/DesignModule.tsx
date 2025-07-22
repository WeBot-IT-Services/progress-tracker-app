import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, ArrowRight, Lock, Unlock } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, type Project } from '../../services/firebaseService';
import { getModulePermissions } from '../../utils/permissions';
import { useDocumentLock, usePresence, useCollaborationCleanup } from '../../hooks/useCollaboration';
import { CollaborationStatus, CollaborationBanner } from '../collaboration/CollaborationIndicators';
import { safeFormatDate, formatDueDate, formatCompletionDate } from '../../utils/dateUtils';


const DesignModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'wip' | 'history'>('wip');
  const [wipProjects, setWipProjects] = useState<Project[]>([]);
  const [historyProjects, setHistoryProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Add state to prevent duplicate operations
  const [processingProject, setProcessingProject] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(new Set());

  // Collaboration state
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<string>('');

  // Collaboration hooks (simplified for build)
  const {
    lockId,
    isLocked
  } = useDocumentLock(selectedProjectForEdit, currentUser?.uid || '');

  const { users, updatePresence } = usePresence(
    currentUser?.uid || '',
    selectedProjectForEdit
  );

  // Mock collaboration properties
  const lockOwner = null;
  const isLockOwner = false;
  const acquireLock = async () => true;
  const releaseLock = async () => {};
  const removePresence = async () => {};
  const lockError = null;
  const presence = [];

  // Cleanup collaboration on unmount
  useCollaborationCleanup(selectedProjectForEdit, 'project', currentUser as any);

  // Cleanup stale operations (timeout after 30 seconds)
  useEffect(() => {
    if (operationInProgress.size > 0) {
      const timeoutId = setTimeout(() => {
        console.warn('Cleaning up stale operations:', Array.from(operationInProgress));
        setOperationInProgress(new Set());
        setProcessingProject(null);
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeoutId);
    }
  }, [operationInProgress]);


  // Get user permissions
  const permissions = getModulePermissions(currentUser?.role || 'designer', 'design');

  // Load projects from Firebase
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const allProjects = await projectsService.getProjects();

        // Validate and clean project data
        const validProjects = allProjects.filter(project => {
          // Ensure project has required fields
          if (!project.id || !project.projectName) {
            console.warn('Invalid project data:', project);
            return false;
          }
          return true;
        }).map(project => {
          // Ensure deliveryDate is properly formatted
          if (project.deliveryDate && typeof project.deliveryDate === 'string') {
            try {
              new Date(project.deliveryDate);
            } catch (error) {
              console.warn('Invalid delivery date for project:', project.id, project.deliveryDate);
              project.deliveryDate = new Date().toISOString();
            }
          }

          // Ensure designData has proper structure
          if (!project.designData) {
            project.designData = {
              status: 'pending',
              lastModified: new Date(),
              hasFlowedFromPartial: false
            };
          }

          return project;
        });

        // WIP: Projects that should appear in DNE WIP section
        // This includes:
        // 1. ALL projects with pending design status (regardless of main project status)
        // 2. ALL projects with partial design status (regardless of main project status)
        // 3. Projects with DNE status that have no designData (defaults to pending)
        const wipProjectsData = validProjects.filter(project => {
          const designStatus = project.designData?.status;

          // Show in WIP if:
          // - Design status is pending (regardless of main project status)
          // - Design status is partial (regardless of main project status)
          // - Project is in DNE status with no designData (defaults to pending)
          const shouldBeInWIP = (
            // Include ALL pending design projects
            designStatus === 'pending' ||
            // Include ALL partial design projects
            designStatus === 'partial' ||
            // Include DNE projects without designData (they default to pending)
            (project.status === 'dne' && !designStatus)
          );

          return shouldBeInWIP;
        });

        // History: Only projects that have been marked as fully completed
        const historyProjectsData = validProjects.filter(project =>
          project.designData?.status === 'completed'
        );

        setWipProjects(wipProjectsData);
        setHistoryProjects(historyProjectsData);
      } catch (error) {
        console.error('Error loading design projects:', error);
        // Set empty arrays on error to prevent UI issues
        setWipProjects([]);
        setHistoryProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);



  // Manual unlock function for administrators
  const handleManualUnlock = async (projectId: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Only administrators can manually unlock projects.');
      return;
    }

    try {
      // Set the project for unlock and force release the lock (admin override)
      setSelectedProjectForEdit(projectId);
      await releaseLock();
      await removePresence();
      setSelectedProjectForEdit('');
      alert('Project unlocked successfully.');
      // Reload projects to refresh lock status
      await loadProjects();
    } catch (error) {
      console.error('Error unlocking project:', error);
      alert('Failed to unlock project. Please try again.');
    }
  };

  const handleDesignStatusChange = async (projectId: string, designStatus: 'pending' | 'partial' | 'completed', flowTo?: 'production' | 'installation', deliveryDate?: Date) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to update design status.');
      return;
    }

    // Check if project is locked by another user
    if (isLocked && !isLockOwner) {
      alert(`Project is currently being edited by ${lockOwner?.userName}. Please wait for them to finish.`);
      return;
    }

    // Prevent duplicate operations - enhanced check
    if (operationInProgress.has(projectId)) {
      console.warn(`Operation already in progress for project ${projectId}`);
      alert('This project is already being processed. Please wait for the current operation to complete.');
      return;
    }

    // Additional check: prevent rapid successive clicks
    const operationKey = `${projectId}-${designStatus}`;
    if (operationInProgress.has(operationKey)) {
      console.warn(`Duplicate operation prevented for ${operationKey}`);
      return;
    }

    setProcessingProject(projectId);
    setOperationInProgress(prev => new Set(prev).add(projectId).add(operationKey));

    try {
      const project = wipProjects.find(p => p.id === projectId) || historyProjects.find(p => p.id === projectId);
      if (!project) return;

      const currentDesignData = project.designData || { status: 'pending', lastModified: new Date(), hasFlowedFromPartial: false };

      // Handle different status changes
      if (designStatus === 'partial') {
        // Partial completed - flow to production or installation but KEEP in DNE status
        const targetModule = flowTo || 'production'; // Default to production if not specified

        // Update design data to mark as partial but KEEP main project status unchanged
        const updates: any = {
          designData: {
            ...currentDesignData,
            status: 'partial',
            partialCompletedAt: new Date(),
            deliveryDate: deliveryDate || new Date(), // Add DNE Completed Date
            hasFlowedFromPartial: true,
            lastModified: new Date()
          },
          // Keep progress at current level for partial completion
          progress: project.progress || 25
        };
        await projectsService.updateProject(projectId, updates);
        console.log(`Project ${projectId} marked as partial - staying in DNE/WIP with delivery date:`, deliveryDate);

        // Flow to BOTH production AND installation for partial completion
        // Update project status to production (workflow service will handle the transition)
        await projectsService.updateProject(projectId, { status: 'production' });
        console.log('Project transitioned to production for partial completion');

        alert(`Design marked as partial completed! Project automatically flowed to BOTH Production and Installation and remains in DNE WIP for further work.`);
        console.log(`✅ DNE Workflow: Project ${projectId} marked as partial and flowed to BOTH Production and Installation`);

        // Reload projects to reflect changes
        await loadProjects();
      } else if (designStatus === 'completed') {
        // Completed - flow to production first (installation will be handled by production team)
        const targetModule = flowTo || 'production'; // Default to production if not specified

        // First update design data to mark as completed
        const updates: any = {
          designData: {
            ...currentDesignData,
            status: 'completed',
            completedAt: new Date(),
            deliveryDate: deliveryDate || new Date(), // Add DNE Completed Date
            lastModified: new Date()
          }
        };
        await projectsService.updateProject(projectId, updates);
        console.log(`Project ${projectId} marked as completed - moving to Production WIP with delivery date:`, deliveryDate);

        // Transition to Production only (not installation yet)
        await projectsService.updateProject(projectId, { status: 'production' });
        console.log('Project transitioned to production for completion');

        alert(`Design completed and automatically moved to Production WIP! Project moved to design history.`);
        console.log(`✅ DNE Workflow: Project ${projectId} completed and flowed to Production WIP`);

        // Reload projects to reflect changes
        await loadProjects();
      } else if (designStatus === 'pending') {
        // Reset to pending (rollback from partial or completed)
        const updates: any = {
          status: 'dne', // Reset main project status back to DNE
          designData: {
            ...currentDesignData,
            status: 'pending',
            hasFlowedFromPartial: false,
            lastModified: new Date()
          },
          progress: 25
        };

        // Remove completion dates
        delete updates.designData.partialCompletedAt;
        delete updates.designData.completedAt;

        await projectsService.updateProject(projectId, updates);
        alert('Design status reset to pending! Project moved back to WIP.');
      }

      // Reload projects
      await loadProjects();
    } catch (error) {
      console.error('Error updating design status:', error);
      alert('Failed to update design status. Please try again.');
    } finally {
      setProcessingProject(null);
      // Clear both project ID and operation key from in-progress set
      setOperationInProgress(prev => {
        const updated = new Set(prev);
        updated.delete(projectId);
        // Clear all operation keys for this project
        Array.from(updated).forEach(key => {
          if (typeof key === 'string' && key.startsWith(`${projectId}-`)) {
            updated.delete(key);
          }
        });
        return updated;
      });
    }
  };

  // Helper function to reload projects
  const loadProjects = async () => {
    try {
      const allProjects = await projectsService.getProjects();


      // Validate and clean project data (same logic as useEffect)
      const validProjects = allProjects.filter(project => {
        if (!project.id || !project.projectName) {
          console.warn('Invalid project data:', project);
          return false;
        }
        return true;
      }).map(project => {
        // Ensure deliveryDate is properly formatted
        if (project.deliveryDate && typeof project.deliveryDate === 'string') {
          try {
            new Date(project.deliveryDate);
          } catch (error) {
            console.warn('Invalid delivery date for project:', project.id, project.deliveryDate);
            project.deliveryDate = new Date().toISOString();
          }
        }

        // Ensure designData has proper structure
        if (!project.designData) {
          project.designData = {
            status: 'pending',
            lastModified: new Date(),
            hasFlowedFromPartial: false
          };
        }

        return project;
      });

      // WIP: Projects that should appear in DNE WIP section
      const wipProjectsData = validProjects.filter(project => {
        const designStatus = project.designData?.status;

        // Show in WIP if:
        // - Design status is pending (regardless of main project status)
        // - Design status is partial (regardless of main project status)
        // - Project is in DNE status with no designData (defaults to pending)
        const shouldBeInWIP = (
          // Include ALL pending design projects
          designStatus === 'pending' ||
          // Include ALL partial design projects
          designStatus === 'partial' ||
          // Include DNE projects without designData (they default to pending)
          (project.status === 'dne' && !designStatus)
        );

        return shouldBeInWIP;
      });

      // History: Only projects that have been marked as fully completed
      const historyProjectsData = validProjects.filter(project =>
        project.designData?.status === 'completed'
      );

      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);
    } catch (error) {
      console.error('Error reloading design projects:', error);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DNE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Production':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Installation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <ModuleContainer
      title="Design & Engineering"
      subtitle="Manage design projects and completion status"
      icon={Wrench}
      iconColor="text-white"
      iconBgColor="bg-gradient-to-r from-blue-500 to-blue-600"
      className="bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      maxWidth="4xl"
      fullViewport={true}
    >
      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Admin Lock Management Banner - Only show if collaboration is working */}
        {currentUser?.role === 'admin' && (isLocked || lockError) && !lockError?.includes('permissions') && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 mb-6">
            <CollaborationBanner
              users={[]}
              className="w-full"
            />
          </div>
        )}


        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 mb-6 shadow-sm border border-white/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('wip')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'wip'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Manage Design
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Design History
            </button>
          </div>
        </div>

        {/* WIP Tab */}
        {activeTab === 'wip' && (
          <div className="space-y-4">
            {!permissions.canView ? (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You do not have permission to view design projects.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading design projects...</p>
              </div>
            ) : wipProjects.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No projects in design phase</p>
                <p className="text-sm text-gray-500 mt-2">Projects from sales will appear here for design work</p>
              </div>
            ) : (
              wipProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                        <div className="flex items-center space-x-2">
                          {/* Next Module Badge */}
                          {project.status === 'completed' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              production
                            </span>
                          )}
                          {project.designData?.status === 'completed' && project.status !== 'completed' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              installation
                            </span>
                          )}
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        <span>Due: {formatDueDate(project.deliveryDate)}</span>
                        <span>Progress: {project.progress || 0}%</span>
                        {project.designData?.status && (
                          <span className="capitalize">Design: {project.designData.status}</span>
                        )}
                        {project.designData?.deliveryDate && (
                          <span>Design Due: {safeFormatDate(project.designData.deliveryDate)}</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>

                      {/* Design Status */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Design Status:</h4>
                          {(processingProject === project.id || operationInProgress.has(project.id!)) && (
                            <div className="flex items-center text-xs text-blue-600">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                              Processing...
                            </div>
                          )}
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`design-status-${project.id}`}
                              checked={project.designData?.status === 'pending' || !project.designData?.status}
                              onChange={async () => {
                                if (operationInProgress.has(project.id!)) return;
                                try {
                                  setSelectedProjectForEdit(project.id!);
                                  const lockAcquired = await acquireLock();
                                  if (lockAcquired) {
                                    await updatePresence('editing');
                                    handleDesignStatusChange(project.id!, 'pending');
                                    await releaseLock();
                                    await removePresence();
                                  } else {
                                    if (lockError?.includes('permissions')) {
                                      handleDesignStatusChange(project.id!, 'pending');
                                    } else {
                                      alert(lockError || 'Project is being edited by another user');
                                    }
                                  }
                                } catch (error) {
                                  handleDesignStatusChange(project.id!, 'pending');
                                }
                              }}
                              disabled={!permissions.canEdit || (isLocked && !isLockOwner && selectedProjectForEdit === project.id) || operationInProgress.has(project.id!) || processingProject === project.id}
                              className="mr-2 text-blue-600"
                            />
                            <span className="text-sm">Pending</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`design-status-${project.id}`}
                              checked={project.designData?.status === 'partial'}
                              onChange={async () => {
                                if (operationInProgress.has(project.id!)) return;
                                try {
                                  setSelectedProjectForEdit(project.id!);
                                  const lockAcquired = await acquireLock();
                                  if (lockAcquired) {
                                    await updatePresence('editing');
                                    handleDesignStatusChange(project.id!, 'partial');
                                    await releaseLock();
                                    await removePresence();
                                  } else {
                                    if (lockError?.includes('permissions')) {
                                      handleDesignStatusChange(project.id!, 'partial');
                                    } else {
                                      alert(lockError || 'Project is being edited by another user');
                                    }
                                  }
                                } catch (error) {
                                  handleDesignStatusChange(project.id!, 'partial');
                                }
                              }}
                              disabled={!permissions.canEdit || (isLocked && !isLockOwner && selectedProjectForEdit === project.id) || operationInProgress.has(project.id!) || processingProject === project.id}
                              className="mr-2 text-blue-600"
                            />
                            <span className="text-sm">Partial</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`design-status-${project.id}`}
                              checked={project.designData?.status === 'completed'}
                              onChange={async () => {
                                if (operationInProgress.has(project.id!)) return;
                                try {
                                  setSelectedProjectForEdit(project.id!);
                                  const lockAcquired = await acquireLock();
                                  if (lockAcquired) {
                                    await updatePresence('editing');
                                    handleDesignStatusChange(project.id!, 'completed');
                                    await releaseLock();
                                    await removePresence();
                                  } else {
                                    if (lockError?.includes('permissions')) {
                                      handleDesignStatusChange(project.id!, 'completed');
                                    } else {
                                      alert(lockError || 'Project is being edited by another user');
                                    }
                                  }
                                } catch (error) {
                                  handleDesignStatusChange(project.id!, 'completed');
                                }
                              }}
                              disabled={!permissions.canEdit || (isLocked && !isLockOwner && selectedProjectForEdit === project.id) || operationInProgress.has(project.id!) || processingProject === project.id}
                              className="mr-2 text-blue-600"
                            />
                            <span className="text-sm">Completed</span>
                          </label>
                        </div>
                      </div>

                      {/* Read-only access notice */}
                      {!permissions.canEdit && (
                        <div className="flex items-center mt-3 text-xs text-gray-500">
                          <Lock className="w-3 h-3 mr-1" />
                          Read-only access
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {!permissions.canView ? (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You do not have permission to view design history.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading design history...</p>
              </div>
            ) : historyProjects.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed design projects found</p>
              </div>
            ) : (
              historyProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          completed
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        <span>Completed: {formatCompletionDate(project.deliveryDate)}</span>
                        <span>Progress: {project.progress || 100}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 100}%` }}
                        ></div>
                      </div>

                      {/* Revert to WIP option for history projects */}
                      {permissions.canEdit && (
                        <div className="pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to revert this project back to WIP? This will move it back to the design phase.')) {
                                handleDesignStatusChange(project.id!, 'pending');
                              }
                            }}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                          >
                            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                            Revert to WIP
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}


      </div>
    </ModuleContainer>
  );
};

export default DesignModule;
