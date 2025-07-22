import React, { useState, useEffect } from 'react';
import { Edit, Trash2, DollarSign, Plus, ArrowRight, Lock, X, Save, Calendar } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import Modal from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, type Project } from '../../services/firebaseService';
import { getModulePermissions, canViewAmount } from '../../utils/permissions';
import { CollaborationBanner, CollaborationStatus } from '../collaboration/CollaborationIndicators';
import { safeFormatDate } from '../../utils/dateUtils';

const SalesModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState<'submit' | 'history'>('submit');
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    amount: '',
    deliveryDate: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Collaboration state (simplified)
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<string>('');
  const [collaborationData, setCollaborationData] = useState({
    isLocked: false,
    lockOwner: '',
    isLockOwner: false,
    presence: []
  });

  // Mock collaboration functions
  const acquireLock = async () => {
    setCollaborationData(prev => ({ ...prev, isLocked: true, isLockOwner: true, lockOwner: currentUser?.name || '' }));
  };
  const releaseLock = async () => {
    setCollaborationData(prev => ({ ...prev, isLocked: false, isLockOwner: false, lockOwner: '' }));
  };
  const updatePresence = async () => {
    // Mock presence update
  };
  const removePresence = async () => {
    // Mock presence removal
  };
  const [showEditForm, setShowEditForm] = useState(false);

  // Helper function to close edit form and release lock
  const closeEditForm = async () => {
    if (selectedProjectForEdit && collaborationData.isLockOwner) {
      await releaseLock();
      await removePresence();
    }
    setShowEditForm(false);
    setEditingProject(null);
    setSelectedProjectForEdit('');
    setFormData({ projectName: '', description: '', amount: '', deliveryDate: '' });
  };

  // Get user permissions
  const permissions = getModulePermissions(currentUser?.role || 'sales', 'sales');
  const canViewAmountField = canViewAmount(currentUser?.role || 'sales');

  // Load projects from Firebase - show all projects for sales team to track
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        console.log('Loading projects...');
        const projectsData = await projectsService.getProjects();
        console.log('Projects loaded:', projectsData.length, projectsData);
        // Filter to show projects that sales team should see (all projects for tracking)
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('You must be logged in to create a project');
      return;
    }

    // Validate required fields
    if (!formData.projectName.trim()) {
      alert('Project name is required');
      return;
    }
    if (!formData.deliveryDate) {
      alert('Delivery date is required');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Current user:', currentUser);

      const projectData = {
        projectName: formData.projectName.trim(),
        description: formData.description?.trim() || '',
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        deliveryDate: formData.deliveryDate,
        estimatedCompletionDate: formData.deliveryDate ? new Date(formData.deliveryDate) : new Date(),
        // Projects now start in 'sales' status, not 'DNE'
        status: 'sales' as const,
        createdBy: currentUser.name // Use employee name instead of UID
      };

      console.log('Creating project with data:', projectData);

      const projectId = await projectsService.createProject(projectData);
      console.log('Project created successfully with ID:', projectId);

      // Project is created with 'sales' status by default
      console.log('Project created and ready for Design & Engineering transition');

      // Reload projects
      const updatedProjects = await projectsService.getProjects();
      setProjects(updatedProjects);
      console.log('Projects reloaded, total count:', updatedProjects.length);

      setShowSuccess(true);
      setFormData({ projectName: '', description: '', amount: '', deliveryDate: '' });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Failed to create project: ${(error as any)?.message || 'Unknown error'}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEditProject = async (project: Project) => {
    // Check if user can edit this project
    if (!permissions.canEdit) {
      alert('You do not have permission to edit projects.');
      return;
    }

    if (!project.id) return;

    // Set the project for collaboration tracking
    setSelectedProjectForEdit(project.id);

    // Try to acquire lock (simplified)
    await acquireLock();

    // Update presence to editing
    await updatePresence();

    setEditingProject(project);
    setFormData({
      projectName: project.projectName || '',
      description: project.description || '',
      amount: project.amount?.toString() || '',
      deliveryDate: project.deliveryDate || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !currentUser) return;

    try {
      setSubmitting(true);

      const updateData = {
        name: formData.projectName,
        description: formData.description,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        deliveryDate: formData.deliveryDate
      };

      await projectsService.updateProject(editingProject.id!, updateData);

      // Reload projects
      const updatedProjects = await projectsService.getProjects();
      setProjects(updatedProjects);

      await closeEditForm();
      alert('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    // Check if user can delete projects
    if (!permissions.canDelete) {
      alert('You do not have permission to delete projects. Only admin users can delete projects.');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    const projectName = project?.projectName || 'Unknown Project';

    // Enhanced confirmation dialog
    const confirmMessage = `DELETE PROJECT CONFIRMATION

Project: ${projectName}
ID: ${projectId}

This action will permanently delete:
• The project and all its data
• All associated milestones and images
• All production and installation records
• Any document locks and collaborative sessions
• Related complaints and notifications

This action CANNOT be undone.

Are you absolutely sure you want to delete this project?`;

    if (!confirm(confirmMessage)) return;

    try {
      console.log('🗑️ Starting comprehensive project deletion for:', projectName);
      await projectsService.deleteProject(projectId);

      // Reload projects to reflect changes
      const updatedProjects = await projectsService.getProjects();
      setProjects(updatedProjects);

      alert(`Project "${projectName}" has been successfully deleted along with all associated data.`);
      console.log('Project deletion completed successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project "${projectName}". Please try again.\n\nError: ${error.message}`);
    }
  };

  const handleMoveToDesign = async (projectId: string) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to move projects to design.');
      return;
    }

    try {
      // Update project status and initialize design data
      await projectsService.updateProject(projectId, {
        status: 'dne',
        progress: 25,
        designData: {
          status: 'pending',
          lastModified: new Date(),
          hasFlowedFromPartial: false
        }
      });

      const updatedProjects = await projectsService.getProjects();
      setProjects(updatedProjects);
      alert('Project moved to Design & Engineering successfully!');
    } catch (error) {
      console.error('Error moving project to design:', error);
      alert('Failed to move project to design. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sales':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dne':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'installation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <ModuleContainer
        title="Sales"
        subtitle="Manage projects and submissions"
        icon={DollarSign}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-green-500 to-green-600"
        className="bg-gradient-to-br from-green-50 via-white to-emerald-50"
        maxWidth="6xl"
        fullViewport={true}
      >
      {/* Secondary Navigation */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 sticky top-20 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-0 py-4">
            {/* Empty - navigation moved to content area */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 mb-6 shadow-sm border border-white/50">
          <div className="flex">
            <button
              onClick={() => setActiveView('submit')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                activeView === 'submit'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Sales
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'history'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Sales History
            </button>
          </div>
        </div>

        {/* Submit Project View */}
        {activeView === 'submit' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">New Project</h2>
              {!permissions.canCreate && (
                <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                  <Lock className="w-4 h-4 mr-2" />
                  <span className="text-sm">Read-only access</span>
                </div>
              )}
            </div>

            {permissions.canCreate ? (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (RM)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter project amount"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>



              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100"
              >
                {submitting ? 'Creating Project...' : 'Submit Project'}
              </button>
            </form>
            ) : (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You do not have permission to create new projects.</p>
                <p className="text-sm text-gray-500 mt-2">Contact your administrator for access.</p>
              </div>
            )}
          </div>
        )}

        {/* Project History View */}
        {activeView === 'history' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No projects found</p>
                <button
                  onClick={() => setActiveView('submit')}
                  className="mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="text-xl font-bold text-gray-900 mr-2">{project.projectName}</span>
                      <span className={`ml-2 px-3 py-1 rounded-full ${getStatusColor(project.status)} text-xs font-semibold`}>
                        {project.status}
                      </span>
                    </div>
                    {project.description && (
                      <div className="text-gray-700 mb-2">{project.description}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Modified {safeFormatDate(project.updatedAt || project.createdAt)}
                      </span>
                      <span>Delivery: {safeFormatDate(project.deliveryDate)}</span>
                      {canViewAmountField && project.amount && (
                        <span className="text-green-600 font-semibold">Amount: RM {project.amount.toLocaleString()}</span>
                      )}
                      <span>Created: {safeFormatDate(project.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-4 sm:mt-0 space-x-3">
                    {permissions.canEdit && (
                      <button
                        onClick={() => handleEditProject(project)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Edit project"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    {permissions.canDelete && (
                      <button
                        onClick={() => handleDeleteProject(project.id!)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete project"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </ModuleContainer>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditForm && !!editingProject}
        onClose={closeEditForm}
        title="Edit Project"
        subtitle={editingProject?.projectName}
        size="md"
        footer={
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={closeEditForm}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-project-form"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl transition-all duration-200 min-h-[44px]"
            >
              {submitting ? 'Updating...' : 'Update Project'}
            </button>
          </div>
        }
      >
        {/* Collaboration Banner */}
        <CollaborationBanner
          users={[]}
          className="mb-4"
        />

        <form id="edit-project-form" onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (RM)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              placeholder="Enter project amount"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Date
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              required
            />
          </div>
        </form>
      </Modal>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
            Project created and automatically moved to Design & Engineering!
          </div>
        )}
    </>
  );
};

// Component to show collaboration status for individual projects
const ProjectCollaborationStatus: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { currentUser } = useAuth();
  
  // Simplified collaboration status (no real-time collaboration)
  return (
    <div className="mb-2">
      <CollaborationStatus
        isLocked={false}
        lockedBy=""
        lastModified={new Date()}
        className="text-xs"
      />
    </div>
  );
};

export default SalesModule;
