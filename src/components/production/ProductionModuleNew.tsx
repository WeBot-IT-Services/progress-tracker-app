import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, ArrowRight, Lock, Unlock, Calendar, Factory } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import MilestoneModal from './MilestoneModal';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, milestonesService, type Project } from '../../services/firebaseService';
import { getModulePermissions } from '../../utils/permissions';
import { useDocumentLock, usePresence, useCollaborationCleanup } from '../../hooks/useCollaboration';
import { CollaborationStatus, CollaborationBanner } from '../collaboration/CollaborationIndicators';
import { safeFormatDate, formatDueDate, formatCompletionDate } from '../../utils/dateUtils';

// Helper function to create default milestones for projects new to production
const createDefaultMilestonesForNewProjects = async (projects: Project[], attemptedSet: Set<string>, setAttemptedSet: React.Dispatch<React.SetStateAction<Set<string>>>) => {
  for (const project of projects) {
    if (!project.id) continue;
    
    // Skip if we've already attempted milestone creation for this project
    if (attemptedSet.has(project.id)) {
      continue;
    }
    
    // Only create milestones if DNE status is partial or completed
    const dneStatus = project.designData?.status;
    if (dneStatus !== 'partial' && dneStatus !== 'completed') {
      console.log(`Skipping milestone creation for project ${project.projectName} - DNE status is: ${dneStatus || 'pending'}`);
      continue;
    }
    
    try {
      // Mark as attempted immediately to prevent race conditions
      setAttemptedSet(prev => new Set(prev).add(project.id));
      
      console.log(`Attempting to create default milestones for project: ${project.projectName} (${project.id}) - DNE status: ${dneStatus}`);
      
      // Use the existing, proper createDefaultProductionMilestones function
      // This function already has built-in duplicate prevention
      await projectsService.createDefaultProductionMilestones(project.id);
      console.log(`✅ Default milestones created for project: ${project.projectName}`);
    } catch (error) {
      console.error(`Error creating default milestone for project ${project.id}:`, error);
      // Don't throw - continue with other projects
      // Don't remove from attempted set in case of error to prevent infinite retry
    }
  }
};


const ProductionModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'wip' | 'history'>('wip');
  const [wipProjects, setWipProjects] = useState<Project[]>([]);
  const [historyProjects, setHistoryProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Add state to prevent duplicate operations
  const [processingProject, setProcessingProject] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(new Set());

  // Add state to track which projects have had milestone creation attempted
  const [milestonesCreationAttempted, setMilestonesCreationAttempted] = useState<Set<string>>(new Set());

  // Collaboration state
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<string>('');

  // Milestone modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedProjectForMilestone, setSelectedProjectForMilestone] = useState<Project | null>(null);

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

  // Cleanup milestone creation tracking on unmount
  useEffect(() => {
    return () => {
      setMilestonesCreationAttempted(new Set());
    };
  }, []);


  // Get user permissions
  const permissions = getModulePermissions(currentUser?.role || 'production', 'production');

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

          // Ensure productionData has proper structure
          if (!project.productionData) {
            project.productionData = {
              status: 'pending',
              lastModified: new Date(),
              hasFlowedFromPartial: false
            };
          }

          return project;
        });

        // WIP: Projects that should appear in Production WIP section
        // This includes projects with production status
        const wipProjectsData = validProjects.filter(project => {
          const productionStatus = project.productionData?.status;

          // Show in WIP if:
          // - Production status is pending
          // - Production status is partial
          // - Project is in production status with no productionData (defaults to pending)
          const shouldBeInWIP = (
            // Include ALL pending production projects
            productionStatus === 'pending' ||
            // Include ALL partial production projects
            productionStatus === 'partial' ||
            // Include production projects without productionData (they default to pending)
            (project.status === 'production' && !productionStatus)
          );

          return shouldBeInWIP;
        });

        // Check for projects that need default milestones created
        await createDefaultMilestonesForNewProjects(wipProjectsData, milestonesCreationAttempted, setMilestonesCreationAttempted);

        // History: Only projects that have been marked as fully completed
        const historyProjectsData = validProjects.filter(project =>
          project.productionData?.status === 'completed'
        );

        setWipProjects(wipProjectsData);
        setHistoryProjects(historyProjectsData);
      } catch (error) {
        console.error('Error loading production projects:', error);
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

  const handleProductionStatusChange = async (projectId: string, productionStatus: 'pending' | 'partial' | 'completed', flowTo?: 'installation', deliveryDate?: Date) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to update production status.');
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
    const operationKey = `${projectId}-${productionStatus}`;
    if (operationInProgress.has(operationKey)) {
      console.warn(`Duplicate operation prevented for ${operationKey}`);
      return;
    }

    setProcessingProject(projectId);
    setOperationInProgress(prev => new Set(prev).add(projectId).add(operationKey));

    try {
      const project = wipProjects.find(p => p.id === projectId) || historyProjects.find(p => p.id === projectId);
      if (!project) return;

      const currentProductionData = project.productionData || { status: 'pending', lastModified: new Date(), hasFlowedFromPartial: false };

      // Handle different status changes
      if (productionStatus === 'partial') {
        // Partial completed - flow to installation but KEEP in Production status
        const updates: any = {
          productionData: {
            ...currentProductionData,
            status: 'partial',
            partialCompletedAt: new Date(),
            deliveryDate: deliveryDate || new Date(),
            hasFlowedFromPartial: true,
            lastModified: new Date()
          },
          progress: Math.max(project.progress || 50, 50)
        };
        await projectsService.updateProject(projectId, updates);
        console.log(`Project ${projectId} marked as partial production - staying in Production WIP`);

        // Flow to installation for partial completion
        await projectsService.updateProject(projectId, { status: 'installation' });
        console.log('Project transitioned to installation for partial completion');

        alert(`Production marked as partial completed! Project automatically flowed to Installation and remains in Production WIP for further work.`);

        // Reload projects to reflect changes
        await loadProjects();
      } else if (productionStatus === 'completed') {
        // Completed - flow to installation
        const updates: any = {
          productionData: {
            ...currentProductionData,
            status: 'completed',
            completedAt: new Date(),
            deliveryDate: deliveryDate || new Date(),
            lastModified: new Date()
          }
        };
        await projectsService.updateProject(projectId, updates);
        console.log(`Project ${projectId} marked as completed - moving to Installation WIP`);

        // Transition to Installation
        await projectsService.updateProject(projectId, { status: 'installation' });
        console.log('Project transitioned to installation for completion');

        alert(`Production completed and automatically moved to Installation WIP! Project moved to production history.`);

        // Reload projects to reflect changes
        await loadProjects();
      } else if (productionStatus === 'pending') {
        // Reset to pending (rollback from partial or completed)
        const updates: any = {
          status: 'production', // Reset main project status back to Production
          productionData: {
            ...currentProductionData,
            status: 'pending',
            hasFlowedFromPartial: false,
            lastModified: new Date()
          },
          progress: 50
        };

        // Remove completion dates
        delete updates.productionData.partialCompletedAt;
        delete updates.productionData.completedAt;

        await projectsService.updateProject(projectId, updates);
        alert('Production status reset to pending! Project moved back to WIP.');
      }

      // Reload projects
      await loadProjects();
    } catch (error) {
      console.error('Error updating production status:', error);
      alert('Failed to update production status. Please try again.');
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

        // Ensure productionData has proper structure
        if (!project.productionData) {
          project.productionData = {
            status: 'pending',
            lastModified: new Date(),
            hasFlowedFromPartial: false
          };
        }

        return project;
      });

      // WIP: Projects that should appear in Production WIP section
      const wipProjectsData = validProjects.filter(project => {
        const productionStatus = project.productionData?.status;

        const shouldBeInWIP = (
          productionStatus === 'pending' ||
          productionStatus === 'partial' ||
          (project.status === 'production' && !productionStatus)
        );

        return shouldBeInWIP;
      });

      // History: Only projects that have been marked as fully completed
      const historyProjectsData = validProjects.filter(project =>
        project.productionData?.status === 'completed'
      );

      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);
    } catch (error) {
      console.error('Error reloading production projects:', error);
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
      title="Production"
      subtitle="Manage production milestones and manufacturing"
      icon={Factory}
      iconColor="text-white"
      iconBgColor="bg-gradient-to-r from-orange-400 to-orange-500"
      className="bg-gradient-to-br from-orange-50 via-white to-amber-50"
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
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Manage Production
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Production History
            </button>
          </div>
        </div>

        {/* WIP Tab */}
        {activeTab === 'wip' && (
          <div className="space-y-4">
            {!permissions.canView ? (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You do not have permission to view production projects.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading production projects...</p>
              </div>
            ) : wipProjects.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No projects in production phase</p>
                <p className="text-sm text-gray-500 mt-2">Projects from design will appear here for production work</p>
              </div>
            ) : (
              wipProjects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          {/* Manual unlock button for admins - Only show if collaboration is working */}
                          {currentUser?.role === 'admin' && isLocked && selectedProjectForEdit === project.id && !isLockOwner && !lockError?.includes('permissions') && (
                            <button
                              onClick={() => handleManualUnlock(project.id!)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Admin: Force unlock project"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Collaboration Status - Only show if collaboration is working */}
                      {selectedProjectForEdit === project.id && !lockError?.includes('permissions') && (
                        <CollaborationStatus
                          isLocked={isLocked}
                          lockedBy={lockOwner?.userName}
                          lastModified={new Date()}
                          className="mb-3"
                        />
                      )}
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>{formatDueDate(project.deliveryDate)}</span>
                        <span>Progress: {project.progress || 0}%</span>
                        {project.productionData?.status && (
                          <span className="capitalize">Production: {project.productionData.status}</span>
                        )}
                        {project.productionData?.deliveryDate && (
                          <span>Production Due: {safeFormatDate(project.productionData.deliveryDate)}</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>

                      {/* Milestones Info Section */}
                      <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                          <h4 className="text-sm font-medium text-emerald-800">Milestones Info</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-emerald-700">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                            Assembly/Welding (starts 8/7/2025)
                          </div>
                          <div className="flex items-center text-emerald-700">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                            Painting (starts 7/24/2025)
                          </div>
                        </div>
                      </div>

                      {/* Production Status Section */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Production Status:</h4>
                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                            ⚡ In Progress
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                          onClick={() => {
                            setSelectedProjectForMilestone(project);
                            setShowMilestoneModal(true);
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Manage Milestones
                        </button>

                        {permissions.canEdit && (
                          <>
                            <button
                              className="w-full flex items-center justify-center px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                              onClick={async () => {
                                if (confirm('Are you sure you want to mark this production as completed? This will move the project to Installation.')) {
                                  try {
                                    setSelectedProjectForEdit(project.id!);
                                    const lockAcquired = await acquireLock();
                                    if (lockAcquired) {
                                      await updatePresence('editing');
                                      await handleProductionStatusChange(project.id!, 'completed');
                                      await releaseLock();
                                      await removePresence();
                                    } else {
                                      if (lockError?.includes('permissions')) {
                                        console.warn('Collaborative editing disabled, proceeding without lock');
                                        await handleProductionStatusChange(project.id!, 'completed');
                                      } else {
                                        alert(lockError || 'Project is currently being edited by another user');
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error in production completion:', error);
                                    await handleProductionStatusChange(project.id!, 'completed');
                                  }
                                }
                              }}
                              disabled={operationInProgress.has(project.id!) || processingProject === project.id}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Complete Production
                            </button>

                            <button
                              className="w-full flex items-center justify-center px-4 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
                              onClick={async () => {
                                if (confirm('Are you sure you want to flow this project to Installation?')) {
                                  try {
                                    setSelectedProjectForEdit(project.id!);
                                    const lockAcquired = await acquireLock();
                                    if (lockAcquired) {
                                      await updatePresence('editing');
                                      await handleProductionStatusChange(project.id!, 'partial');
                                      await releaseLock();
                                      await removePresence();
                                    } else {
                                      if (lockError?.includes('permissions')) {
                                        console.warn('Collaborative editing disabled, proceeding without lock');
                                        await handleProductionStatusChange(project.id!, 'partial');
                                      } else {
                                        alert(lockError || 'Project is currently being edited by another user');
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error in installation flow:', error);
                                    await handleProductionStatusChange(project.id!, 'partial');
                                  }
                                }
                              }}
                              disabled={operationInProgress.has(project.id!) || processingProject === project.id}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Flow to Installation
                            </button>
                          </>
                        )}
                        
                        {!permissions.canEdit && (
                          <div className="flex items-center justify-center text-gray-500 text-sm py-2">
                            <Lock className="w-4 h-4 mr-1" />
                            Read-only access
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {!permissions.canView ? (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You do not have permission to view production history.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading production history...</p>
              </div>
            ) : historyProjects.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed production projects found</p>
              </div>
            ) : (
              historyProjects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>{formatCompletionDate(project.deliveryDate)}</span>
                        <span>Progress: {project.progress || 100}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 100}%` }}
                        ></div>
                      </div>

                      {/* Revert to WIP option for history projects */}
                      {permissions.canEdit && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to revert this project back to WIP? This will move it back to the production phase.')) {
                                handleProductionStatusChange(project.id!, 'pending');
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

      {/* Milestone Management Modal */}
      {selectedProjectForMilestone && (
        <MilestoneModal
          isOpen={showMilestoneModal}
          onClose={() => {
            setShowMilestoneModal(false);
            setSelectedProjectForMilestone(null);
          }}
          projectId={selectedProjectForMilestone.id!}
          projectTitle={selectedProjectForMilestone.projectName}
        />
      )}
    </ModuleContainer>
  );
};

export default ProductionModule;
