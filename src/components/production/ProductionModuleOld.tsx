import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, ArrowRight, Lock, Unlock, Factory, Clock, X, Plus, ImageIcon, Edit, Trash2, Calendar } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, milestonesService, type Project, type Milestone } from '../../services/firebaseService';
import { getModulePermissions } from '../../utils/permissions';
import { useDocumentLock, usePresence, useCollaborationCleanup } from '../../hooks/useCollaboration';
import { CollaborationStatus, CollaborationBanner } from '../collaboration/CollaborationIndicators';
import { safeFormatDate, formatDueDate, formatCompletionDate } from '../../utils/dateUtils';
import MilestoneImageUpload from './MilestoneImageUpload';

const ProductionModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'wip' | 'history' | 'installation'>('wip');
  const [wipProjects, setWipProjects] = useState<Project[]>([]);
  const [historyProjects, setHistoryProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showEditMilestone, setShowEditMilestone] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [hasEditedMilestones, setHasEditedMilestones] = useState<Record<string, boolean>>({});
  
  // Add state to prevent duplicate milestone creation
  const [creatingMilestonesFor, setCreatingMilestonesFor] = useState<Set<string>>(new Set());
  const [milestonesCreated, setMilestonesCreated] = useState<Set<string>>(new Set());
  
  // Add state to track milestones for each project
  const [projectMilestones, setProjectMilestones] = useState<Record<string, Milestone[]>>({});


  // Get user permissions
  const permissions = getModulePermissions(currentUser?.role || 'production', 'production');

  // Create default milestones for a project with enhanced duplicate prevention
  const createDefaultMilestones = async (projectId: string) => {
    // Prevent duplicate creation attempts
    if (creatingMilestonesFor.has(projectId)) {
      console.log(`Milestone creation already in progress for project: ${projectId}`);
      return;
    }

    // Check if milestones were already created in this session
    if (milestonesCreated.has(projectId)) {
      console.log(`Milestones already created for project: ${projectId}`);
      return;
    }

    try {
      // Mark as being processed
      setCreatingMilestonesFor(prev => new Set(prev).add(projectId));
      
      // Double-check: fetch fresh milestones to ensure none were created by another process
      const existingMilestones = await milestonesService.getMilestonesByProject(projectId);
      const productionMilestones = existingMilestones.filter(m => m.module === 'production' || !m.module);
      
      if (productionMilestones.length > 0) {
        console.log(`Production milestones already exist for project: ${projectId} (found ${productionMilestones.length})`);
        // Store existing milestones
        setProjectMilestones(prev => ({
          ...prev,
          [projectId]: productionMilestones
        }));
        setMilestonesCreated(prev => new Set(prev).add(projectId));
        return;
      }

      // Final safety check: verify project still exists and needs milestones
      const project = await projectsService.getProject(projectId);
      if (!project || (project.productionData?.milestones && project.productionData.milestones.length > 0)) {
        console.log(`Project ${projectId} no longer needs default milestones`);
        setMilestonesCreated(prev => new Set(prev).add(projectId));
        return;
      }

      // Create the default milestones
      await projectsService.createDefaultProductionMilestones(projectId);
      console.log(`Default production milestones created for project: ${projectId}`);
      
      // Fetch the newly created milestones and store them
      const newMilestones = await milestonesService.getMilestonesByProject(projectId);
      const newProductionMilestones = newMilestones.filter(m => m.module === 'production' || !m.module);
      setProjectMilestones(prev => ({
        ...prev,
        [projectId]: newProductionMilestones
      }));
      
      // Mark as completed
      setMilestonesCreated(prev => new Set(prev).add(projectId));
    } catch (error) {
      console.error(`Error creating default milestones for project ${projectId}:`, error);
      // Don't mark as completed if there was an error, allow retry
    } finally {
      // Always remove from processing set
      setCreatingMilestonesFor(prev => {
        const updated = new Set(prev);
        updated.delete(projectId);
        return updated;
      });
    }
  };

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allProjects = await projectsService.getProjects();

        // WIP: Projects that should appear in Production
        // This includes:
        // 1. Projects with main status 'production'
        // 2. Projects that have productionData but haven't moved to installation/completed yet
        const wipProjectsData = allProjects.filter(project =>
          project.status === 'production' ||
          (project.productionData && project.status !== 'installation' && project.status !== 'completed')
        );

        // History: Projects that have moved from production to installation or completed
        const historyProjectsData = allProjects.filter(project =>
          project.productionData && (project.status === 'installation' || project.status === 'completed')
        );

        setWipProjects(wipProjectsData);
        setHistoryProjects(historyProjectsData);

        // Load milestones for selected project
        if (selectedProject) {
          const milestonesData = await milestonesService.getMilestonesByProject(selectedProject);
          // Filter milestones based on current tab
          const filteredMilestones = activeTab === 'installation'
            ? milestonesData.filter(m => m.module === 'installation')
            : milestonesData.filter(m => m.module === 'production' || !m.module); // Default to production for legacy milestones
          setMilestones(filteredMilestones);
        } else {
          setMilestones([]);
        }
      } catch (error) {
        console.error('Error loading production data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProject, activeTab]); // Added activeTab to dependencies for milestone filtering

  // Separate effect for creating default milestones
  useEffect(() => {
    const createMilestonesForNewProjects = async () => {
      // Only run if we have WIP projects loaded
      if (wipProjects.length === 0) return;

      // Find projects that need default milestones
      const projectsNeedingMilestones = wipProjects.filter(project => 
        project.id && // Ensure project has an ID
        !creatingMilestonesFor.has(project.id) && // Not currently being processed
        !milestonesCreated.has(project.id) && // Not already processed
        (!project.productionData?.milestones || project.productionData.milestones.length === 0) // No existing milestones
      );

      // Create milestones for qualifying projects (one at a time to prevent race conditions)
      for (const project of projectsNeedingMilestones) {
        if (project.id) {
          await createDefaultMilestones(project.id);
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };

    createMilestonesForNewProjects();
  }, [wipProjects, creatingMilestonesFor, milestonesCreated]); // Run when WIP projects change or processing state changes

  // Cleanup stale milestone creation operations (timeout after 60 seconds)
  useEffect(() => {
    if (creatingMilestonesFor.size > 0) {
      const timeoutId = setTimeout(() => {
        console.warn('Cleaning up stale milestone creation operations:', Array.from(creatingMilestonesFor));
        setCreatingMilestonesFor(new Set());
      }, 60000); // 60 seconds timeout

      return () => clearTimeout(timeoutId);
    }
  }, [creatingMilestonesFor]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject || !permissions.canCreate) return;

    try {
      setSubmitting(true);

      const milestoneData = {
        projectId: selectedProject,
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        status: 'pending' as const,
        module: (activeTab === 'installation' ? 'installation' : 'production') as 'installation' | 'production'
      };

      await milestonesService.createMilestone(milestoneData);

      // Reload milestones
      const updatedMilestones = await milestonesService.getMilestonesByProject(selectedProject);
      setMilestones(updatedMilestones);

      // Mark project as having edited milestones
      setHasEditedMilestones(prev => ({ ...prev, [selectedProject]: true }));

      setShowMilestoneForm(false);
      setFormData({ title: '', description: '', assignedTo: '' });
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Failed to create milestone. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!permissions.canDelete) {
      alert('You do not have permission to delete milestones.');
      return;
    }

    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      await milestonesService.deleteMilestone(milestoneId);

      // Reload milestones
      if (selectedProject) {
        const updatedMilestones = await milestonesService.getMilestonesByProject(selectedProject);
        setMilestones(updatedMilestones);
      }

      alert('Milestone deleted successfully!');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Failed to delete milestone. Please try again.');
    }
  };

  const updateProjectStatus = async (projectId: string, status: Project['status'], deliveryDate?: Date) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to update project status.');
      return;
    }

    try {
      // For status changes (like rollbacks), use direct update
      const updates: any = { status };
      await projectsService.updateProject(projectId, updates);
      alert(`Project moved to ${status} successfully!`);

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project =>
        project.status === 'production' ||
        (project.productionData && project.status !== 'installation' && project.status !== 'completed')
      );
      const historyProjectsData = allProjects.filter(project =>
        project.productionData && (project.status === 'installation' || project.status === 'completed')
      );


      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Failed to update project status.');
    }
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      assignedTo: milestone.assignedTo || ''
    });
    setShowEditMilestone(true);
  };

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !currentUser) return;

    try {
      setSubmitting(true);

      const updateData = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo
      };

      await milestonesService.updateMilestone(editingMilestone.id!, updateData);

      // Reload milestones
      const updatedMilestones = await milestonesService.getMilestonesByProject(selectedProject);
      setMilestones(updatedMilestones);

      // Mark project as having edited milestones
      setHasEditedMilestones(prev => ({ ...prev, [selectedProject]: true }));

      setShowEditMilestone(false);
      setEditingMilestone(null);
      setFormData({ title: '', description: '', assignedTo: '' });
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };





  const handleCompleteProduction = async (projectId: string, deliveryDate?: Date) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to complete production.');
      return;
    }

    // Validate that DNE is completed before allowing production completion
    try {
      const project = await projectsService.getProject(projectId);
      if (!project) {
        alert('Project not found.');
        return;
      }

      // Check if DNE is completed
      if (!project.designData?.status || project.designData.status === 'pending') {
        alert('Cannot complete production. Design & Engineering must be completed first.');
        return;
      }

      if (!confirm('Mark this production as completed and move to installation?')) return;

      // Use workflow service for automatic transition
      await projectsService.updateProject(projectId, { status: 'installation' });
      console.log('Project transitioned to installation');

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project =>
        project.status === 'production' ||
        (project.productionData && project.status !== 'installation' && project.status !== 'completed')
      );
      const historyProjectsData = allProjects.filter(project =>
        project.productionData && (project.status === 'installation' || project.status === 'completed')
      );


      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);

      alert('Production completed successfully and moved to installation with delivery date tracking!');
    } catch (error) {
      console.error('Error completing production:', error);
      alert('Failed to complete production. Please try again.');
    }
  };

  const handleFlowToInstallation = async (projectId: string) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to flow projects to installation.');
      return;
    }

    try {
      const project = await projectsService.getProject(projectId);
      if (!project) {
        alert('Project not found.');
        return;
      }

      if (!confirm('Flow this project to installation? It will be available in the installation module for photo uploads and progress tracking.')) return;

      // Add installation data to make the project available in installation module
      await projectsService.updateProject(projectId, { 
        installationData: {
          milestoneProgress: {},
          lastModified: new Date(),
          notes: 'Project flowed from production module',
          assignedAt: new Date()
        }
      });
      
      console.log('Project prepared for installation module');

      // Reload projects to reflect changes
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project =>
        project.status === 'production' ||
        (project.productionData && project.status !== 'installation' && project.status !== 'completed')
      );
      const historyProjectsData = allProjects.filter(project =>
        project.productionData && (project.status === 'installation' || project.status === 'completed')
      );
      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);

      alert('Project successfully flowed to installation! It is now available in the Installation module.');
    } catch (error) {
      console.error('Error flowing project to installation:', error);
      alert('Failed to flow project to installation. Please try again.');
    }
  };



  return (
    <>
      <ModuleContainer
        title="Production"
        subtitle="Manage production milestones and manufacturing"
        icon={Factory}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-orange-500 to-orange-600"
        className="bg-gradient-to-br from-orange-50 via-white to-amber-50"
        maxWidth="7xl"
        fullViewport={true}
      >

      {/* Content - No top padding needed, ModuleContainer handles positioning */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {!permissions.canView ? (
              <div className="col-span-full text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You do not have permission to view production projects.</p>
              </div>
            ) : loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading production projects...</p>
              </div>
            ) : wipProjects.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No projects in production</p>
                <p className="text-sm text-gray-500 mt-2">Projects from design will appear here with default milestones</p>
              </div>
            ) : (
              wipProjects.map((project) => (
                <div key={project.id} className="group bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/60 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full -translate-y-16 translate-x-16 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 animate-pulse"></div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors">
                            {project.projectName}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-xl text-sm font-semibold border-2 border-orange-200 shadow-sm">
                            {project.status}
                          </span>
                          
                          {/* DNE Status Badge */}
                          {project.designData?.status === 'completed' ? (
                            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-3 py-1 rounded-lg font-medium border border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              DNE Completed
                            </span>
                          ) : project.designData?.status === 'pending' ? (
                            <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-lg font-medium border border-yellow-200">
                              <Clock className="w-3 h-3 mr-1" />
                              DNE Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-lg font-medium border border-gray-200">
                              <X className="w-3 h-3 mr-1" />
                              DNE Not Started
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Project Description */}
                    {project.description && (
                      <div className="mb-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                        <p className="text-gray-700 text-sm leading-relaxed">{project.description}</p>
                      </div>
                    )}

                    {/* Project Details Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center">
                        <div className="text-xs font-medium text-orange-600 mb-1">Due Date</div>
                        <div className="text-sm font-semibold text-orange-800">{formatDueDate(project.deliveryDate || project.completionDate)}</div>
                      </div>
                    </div>

                    {/* Milestone Creation Status */}
                    {creatingMilestonesFor.has(project.id!) && (
                      <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center text-blue-700">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                          <span className="text-sm font-medium">Creating default milestones...</span>
                        </div>
                      </div>
                    )}

                    {milestonesCreated.has(project.id!) && !creatingMilestonesFor.has(project.id!) && (
                      <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                        <div className="flex items-center text-green-700 mb-3">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm font-semibold">Milestones Created</span>
                        </div>
                        {projectMilestones[project.id!] && projectMilestones[project.id!].length > 0 && (
                          <div className="ml-7 space-y-2">
                            {projectMilestones[project.id!].map((milestone, index) => (
                              <div key={milestone.id || index} className="flex items-center text-xs text-green-600 bg-white/60 rounded-lg p-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></div>
                                <div className="flex-1">
                                  <span className="font-medium">{milestone.title}</span>
                                  {milestone.startDate && (
                                    <span className="ml-2 text-green-500">
                                      (starts {safeFormatDate(milestone.startDate, 'Not set')})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Enhanced Action Buttons Section */}
                    <div className="space-y-4">
                      {/* Primary Action Button */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => setSelectedProject(project.id!)}
                          disabled={creatingMilestonesFor.has(project.id!)}
                          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-sm ${
                            creatingMilestonesFor.has(project.id!)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          <Calendar className="w-5 h-5" />
                          {creatingMilestonesFor.has(project.id!) ? 'Creating Milestones...' : 'Manage Milestones'}
                        </button>
                      </div>

                      {/* Secondary Actions */}
                      {permissions.canEdit ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => handleCompleteProduction(project.id!, new Date())}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md border border-green-300"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete Production
                          </button>
                          
                          {/* Flow to Installation button - available when DNE is not completed */}
                          {project.designData?.status !== 'completed' && (
                            <button
                              onClick={() => handleFlowToInstallation(project.id!)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 text-purple-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md border border-purple-300"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Flow to Installation
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3 p-4 bg-gray-100 rounded-xl border border-gray-200">
                          <Lock className="w-5 h-5 text-gray-500" />
                          <span className="text-gray-600 font-medium">Read-only access</span>
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
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {!permissions.canView ? (
              <div className="col-span-full text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You do not have permission to view production history.</p>
              </div>
            ) : loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading production history...</p>
              </div>
            ) : historyProjects.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed production projects found</p>
              </div>
            ) : (
              historyProjects.map((project) => (
                <div key={project.id} className="group bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/60 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-full -translate-y-16 translate-x-16 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                            {project.projectName}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-semibold border-2 border-green-200 shadow-sm">
                            {project.status}
                          </span>
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            Production Completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Project Description */}
                    {project.description && (
                      <div className="mb-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                        <p className="text-gray-700 text-sm leading-relaxed">{project.description}</p>
                      </div>
                    )}

                    {/* Project Details Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                        <div className="text-xs font-medium text-green-600 mb-1">Completed</div>
                        <div className="text-sm font-semibold text-green-800">{formatCompletionDate(project.deliveryDate || project.completionDate)}</div>
                      </div>
                    </div>

                    {/* Rollback Options */}
                    {permissions.canEdit && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to rollback this project to production? This will move it back to the production phase.')) {
                                updateProjectStatus(project.id!, 'production');
                              }
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                          >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            Rollback to Production
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </ModuleContainer>

      {/* Milestones Management Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Milestone Management</h3>
                  <p className="text-gray-600 mt-1">
                    Project: <span className="font-medium">{wipProjects.find(p => p.id === selectedProject)?.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProject('')}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Default Milestones Info - Only show if project hasn't been edited */}
              {/* {!hasEditedMilestones[selectedProject] && (
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">Default Production Milestones</h4>
                  <div className="text-sm text-orange-700">
                    <p>The following milestones are automatically created when projects enter production:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Assembly/Welding (Starts in 2 weeks)</li>
                      <li>Painting (Starts in 3 weeks)</li>
                    </ul>
                    <p className="mt-2 text-xs text-orange-600">
                      You can add custom milestones or modify existing ones below.
                    </p>
                  </div>
                </div>
              )} */}

              {/* Milestones List */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Project Milestones</h4>
                  {permissions.canCreate && (
                    <button
                      onClick={() => setShowMilestoneForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom Milestone
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading milestones...</p>
                  </div>
                ) : milestones.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No milestones found</p>
                    <p className="text-sm text-gray-500">Default milestones should be created automatically</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                            </div>
                            {milestone.description && (
                              <p className="text-gray-600 mb-2 text-sm">{milestone.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Start: {safeFormatDate(milestone.startDate)}</span>
                              {milestone.assignedTo && <span>Assigned: {milestone.assignedTo}</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone.id!);
                                setShowImageUpload(true);
                              }}
                              className={`relative p-2 rounded-xl transition-all duration-200 hover:shadow-sm ${
                                milestone.images && milestone.images.length > 0
                                  ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                  : 'text-gray-600 hover:text-green-600 bg-gray-50 hover:bg-green-50'
                              }`}
                              title={`${milestone.images?.length || 0} image(s) - ${
                                permissions.canEdit ? 'Click to manage' : 'Click to view (read-only)'
                              }`}
                            >
                              <ImageIcon className="h-4 w-4" />
                              {milestone.images && milestone.images.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                  {milestone.images.length}
                                </span>
                              )}
                            </button>
                            {permissions.canEdit && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMilestone(milestone);
                                    setFormData({
                                      title: milestone.title,
                                      description: milestone.description || '',
                                      assignedTo: milestone.assignedTo || ''
                                    });
                                    setShowEditMilestone(true);
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:shadow-sm"
                                  title="Edit milestone"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMilestone(milestone.id!)}
                                  className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 hover:shadow-sm"
                                  title="Delete milestone"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setSelectedProject('')}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Upload Modal */}
        {showImageUpload && selectedMilestone && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Milestone Images - {milestones.find(m => m.id === selectedMilestone)?.title}
                </h3>
                <button
                  onClick={() => {
                    setShowImageUpload(false);
                    setSelectedMilestone('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <MilestoneImageUpload
                  milestoneId={selectedMilestone}
                  projectId={selectedProject}
                  existingImages={(milestones.find(m => m.id === selectedMilestone)?.images || []).map((url, index) => ({
                    id: `${selectedMilestone}-${index}`,
                    url: url,
                    caption: '',
                    uploadedAt: new Date(),
                    uploadedBy: 'Unknown'
                  }))}
                  permissions={permissions}
                  onImagesUpdated={async (images) => {
                    try {
                      // Convert MilestoneImage[] back to string[] for storage
                      const imageUrls = images.map(img => img.url);
                      await milestonesService.updateMilestone(selectedMilestone, { images: imageUrls });

                      // Reload milestones to reflect changes
                      const updatedMilestones = await milestonesService.getMilestonesByProject(selectedProject);
                      setMilestones(updatedMilestones);

                      console.log('Milestone images updated successfully');
                    } catch (error) {
                      console.error('Error updating milestone images:', error);
                      alert('Failed to update milestone images. Please try again.');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Add Milestone Modal */}
        {showMilestoneForm && (
          <div className="space-y-4">
            {!selectedProject ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a project to view milestones</p>
                <button
                  onClick={() => setActiveTab('wip')}
                  className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                >
                  View Projects
                </button>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading milestones...</p>
              </div>
            ) : (
              <>
                {/* Project Info */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {wipProjects.find(p => p.id === selectedProject)?.name || historyProjects.find(p => p.id === selectedProject)?.name}
                      </h3>
                      <p className="text-gray-600">Project Milestones</p>
                    </div>
                    <button
                      onClick={() => setSelectedProject('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Milestones List */}
                {milestones.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No milestones created yet</p>
                    <button
                      onClick={() => setShowMilestoneForm(true)}
                      className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                    >
                      Create First Milestone
                    </button>
                  </div>
                ) : (
                  milestones.map((milestone) => (
                    <div key={milestone.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                          </div>
                          {milestone.description && (
                            <p className="text-gray-600 mb-3">{milestone.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                            <span>{formatDueDate(milestone.startDate)}</span>
                            {milestone.assignedTo && <span>Assigned to: {milestone.assignedTo}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditMilestone(milestone)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(milestone.id!)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {/* Milestone Form Modal */}
        {showMilestoneForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* <h3 className="text-xl font-semibold text-gray-900 mb-4">New Milestone</h3> */}
              <form onSubmit={handleCreateMilestone} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter milestone title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter milestone description (optional)"
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter assignee name"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMilestoneForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    {submitting ? 'Creating...' : 'Create Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Milestone Modal */}
        {showEditMilestone && editingMilestone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Milestone</h3>
              <form onSubmit={handleUpdateMilestone} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter milestone title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter milestone description (optional)"
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter assignee name"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditMilestone(false);
                      setEditingMilestone(null);
                      setFormData({ title: '', description: '', assignedTo: '' });
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    {submitting ? 'Updating...' : 'Update Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default ProductionModule;
