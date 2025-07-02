import React, { useState, useEffect } from 'react';
import { Factory, Plus, Calendar, CheckCircle, Clock, Edit, Trash2, Lock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import ModuleHeader from '../common/ModuleHeader';
import MilestoneImageUpload from './MilestoneImageUpload';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, milestonesService, type Project, type Milestone } from '../../services/firebaseService';
import { workflowService } from '../../services/workflowService';
import { getModulePermissions } from '../../utils/permissions';

const ProductionModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'wip' | 'history'>('wip');
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
    startDate: '',
    assignedTo: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [hasEditedMilestones, setHasEditedMilestones] = useState<Record<string, boolean>>({});


  // Get user permissions
  const permissions = getModulePermissions(currentUser?.role || 'production', 'production');

  // Create default milestones for a project
  const createDefaultMilestones = async (projectId: string) => {
    try {
      // Use the existing function from projectsService
      await projectsService.createDefaultProductionMilestones(projectId);
    } catch (error) {
      console.error('Error creating default milestones:', error);
    }
  };

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allProjects = await projectsService.getProjects();

        // WIP: Projects in production status
        const wipProjectsData = allProjects.filter(project => project.status === 'production');

        // Create default milestones for projects that don't have them
        for (const project of wipProjectsData) {
          if (!project.productionData?.milestones || project.productionData.milestones.length === 0) {
            await createDefaultMilestones(project.id!);
          }
        }

        // History: Projects that have moved from production to installation or completed
        const historyProjectsData = allProjects.filter(project =>
          project.productionData && (project.status === 'installation' || project.status === 'completed')
        );

        setWipProjects(wipProjectsData);
        setHistoryProjects(historyProjectsData);

        // Load milestones for selected project
        if (selectedProject) {
          const milestonesData = await milestonesService.getMilestonesByProject(selectedProject);
          setMilestones(milestonesData);
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
  }, [selectedProject]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject || !permissions.canCreate) return;

    try {
      setSubmitting(true);

      const milestoneData = {
        projectId: selectedProject,
        title: formData.title,
        startDate: formData.startDate,
        assignedTo: formData.assignedTo,
        status: 'pending' as const
      };

      await milestonesService.createMilestone(milestoneData);

      // Reload milestones
      const updatedMilestones = await milestonesService.getMilestonesByProject(selectedProject);
      setMilestones(updatedMilestones);

      // Mark project as having edited milestones
      setHasEditedMilestones(prev => ({ ...prev, [selectedProject]: true }));

      setShowMilestoneForm(false);
      setFormData({ title: '', startDate: '', assignedTo: '' });
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
      const wipProjectsData = allProjects.filter(project => project.status === 'production');
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
      startDate: milestone.startDate,
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
        startDate: formData.startDate,
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
      setFormData({ title: '', startDate: '', assignedTo: '' });
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };



  const handleUpdateMilestoneStatus = async (milestoneId: string, status: Milestone['status']) => {
    try {
      await milestonesService.updateMilestone(milestoneId, {
        status,
        completedDate: status === 'completed' ? new Date().toISOString() : undefined
      });

      const updatedMilestones = await milestonesService.getMilestonesByProject(selectedProject);
      setMilestones(updatedMilestones);
    } catch (error) {
      console.error('Error updating milestone status:', error);
      alert('Failed to update milestone status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <ModuleHeader
        title="Production"
        subtitle="Manage production milestones and manufacturing"
        icon={Factory}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-orange-500 to-orange-600"
      >
        {selectedProject && (
          <button
            onClick={() => setShowMilestoneForm(true)}
            className="flex items-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Milestone
          </button>
        )}
      </ModuleHeader>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              🔧 WIP (Production)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              📊 History
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
                <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No projects in production</p>
                <p className="text-sm text-gray-500 mt-2">Projects from design will appear here with default milestones</p>
              </div>
            ) : (
              wipProjects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>Due: {new Date(project.completionDate).toLocaleDateString()}</span>
                        <span>Progress: {project.progress || 0}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>





                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedProject(project.id!)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Manage Milestones
                        </button>

                        {!permissions.canEdit && (
                          <div className="flex items-center text-gray-500 text-sm">
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
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
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>Completed: {new Date(project.completionDate).toLocaleDateString()}</span>
                        <span>Progress: {project.progress || 100}%</span>
                      </div>

                      {/* Rollback Options */}
                      {permissions.canEdit && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to rollback this project to production? This will move it back to the production phase.')) {
                                updateProjectStatus(project.id!, 'production');
                              }
                            }}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                          >
                            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                            Rollback to Production
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
              {!hasEditedMilestones[selectedProject] && (
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
              )}

              {/* Milestones List */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Project Milestones</h4>
                  {permissions.canCreate && (
                    <button
                      onClick={() => setShowMilestoneForm(true)}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded-lg text-sm transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
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
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                                milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {milestone.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Start: {milestone.startDate}</span>
                              {milestone.assignedTo && <span>Assigned: {milestone.assignedTo}</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone.id!);
                                setShowImageUpload(true);
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Upload images"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </button>
                            {permissions.canEdit && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMilestone(milestone);
                                    setFormData({
                                      title: milestone.title,
                                      startDate: milestone.startDate,
                                      assignedTo: milestone.assignedTo || ''
                                    });
                                    setShowEditMilestone(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit milestone"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMilestone(milestone.id!)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedProject('')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-6 rounded-xl transition-colors"
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
                  existingImages={[]} // TODO: Load existing images from milestone data
                  onImagesUpdated={(images) => {
                    // TODO: Update milestone with new images
                    console.log('Images updated:', images);
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(milestone.status)}`}>
                              {milestone.status.toUpperCase()}
                            </span>
                          </div>
                          {milestone.description && (
                            <p className="text-gray-600 mb-3">{milestone.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                            <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                            {milestone.assignedTo && <span>Assigned to: {milestone.assignedTo}</span>}
                            {milestone.completedDate && (
                              <span>Completed: {new Date(milestone.completedDate).toLocaleDateString()}</span>
                            )}
                          </div>

                          {/* Status Update Buttons */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <button
                              onClick={() => handleUpdateMilestoneStatus(milestone.id!, 'in-progress')}
                              disabled={milestone.status === 'in-progress'}
                              className="bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              In Progress
                            </button>
                            <button
                              onClick={() => handleUpdateMilestoneStatus(milestone.id!, 'completed')}
                              disabled={milestone.status === 'completed'}
                              className="bg-green-100 hover:bg-green-200 disabled:bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </button>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">New Milestone</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
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
                      setFormData({ title: '', startDate: '', assignedTo: '' });
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
      </div>
    </div>
  );
};

export default ProductionModule;
