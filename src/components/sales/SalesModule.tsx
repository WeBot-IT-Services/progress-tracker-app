import React, { useState, useEffect } from 'react';
import { Edit, Trash2, DollarSign, Plus, ArrowRight, Lock, X, Save, Calendar } from 'lucide-react';
import ModuleHeader from '../common/ModuleHeader';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, type Project } from '../../services/firebaseService';
import { workflowService } from '../../services/workflowService';
import { getModulePermissions, canViewAmount } from '../../utils/permissions';
import { useDocumentLock, usePresence, useCollaborationCleanup } from '../../hooks/useCollaboration';
import { CollaborationBanner, CollaborationStatus } from '../collaboration/CollaborationIndicators';

const SalesModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
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

  // Collaboration state
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<string>('');
  const {
    isLocked,
    lockOwner,
    isLockOwner,
    acquireLock,
    releaseLock,
    lockError
  } = useDocumentLock(selectedProjectForEdit, 'project', currentUser);

  const { presence, updatePresence, removePresence } = usePresence(
    selectedProjectForEdit,
    'project',
    currentUser
  );

  // Cleanup collaboration on unmount
  useCollaborationCleanup(selectedProjectForEdit, 'project', currentUser);
  const [showEditForm, setShowEditForm] = useState(false);

  // Helper function to close edit form and release lock
  const closeEditForm = async () => {
    if (selectedProjectForEdit && isLockOwner) {
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
        // Projects now start in 'sales' status, not 'DNE'
        status: 'sales' as const,
        createdBy: currentUser.uid
      };

      console.log('Creating project with data:', projectData);

      const projectId = await projectsService.createProject(projectData);
      console.log('Project created successfully with ID:', projectId);

      // Automatically transition to Design & Engineering
      await workflowService.transitionSalesToDesign(projectId, new Date());
      console.log('Project transitioned to Design & Engineering');

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

    // Try to acquire lock
    const lockAcquired = await acquireLock();

    if (lockAcquired) {
      // Update presence to editing
      await updatePresence('editing');

      setEditingProject(project);
      setFormData({
        projectName: project.projectName || '',
        description: project.description || '',
        amount: project.amount?.toString() || '',
        deliveryDate: project.deliveryDate || ''
      });
      setShowEditForm(true);
    } else {
      // Lock acquisition failed, show error
      alert(lockError || 'Unable to edit project - it may be locked by another user');
    }
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
      alert('You do not have permission to delete projects.');
      return;
    }

    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsService.deleteProject(projectId);
      const updatedProjects = await projectsService.getProjects();
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <ModuleHeader
        title="Sales"
        subtitle="Manage projects and submissions"
        icon={DollarSign}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-green-500 to-green-600"
      >
        <button
          onClick={() => setActiveTab('submit')}
          className="flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </ModuleHeader>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Navigation */}
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-2 mb-8 shadow-lg border border-white/20">
          <div className="flex">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex-1 py-4 px-6 text-center font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'submit'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              📝 Submit New Project
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 text-center font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              📊 Project History
            </button>
          </div>
        </div>

        {/* Submit Project Tab */}
        {activeTab === 'submit' && (
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

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
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
                  onClick={() => setActiveTab('submit')}
                  className="mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.projectName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-600 mb-2">{project.description}</p>
                      )}

                      {/* Collaboration Status */}
                      {project.id && (
                        <ProjectCollaborationStatus projectId={project.id} />
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>Delivery: {new Date(project.deliveryDate).toLocaleDateString()}</span>
                        {canViewAmountField && project.amount && (
                          <span className="font-medium text-green-600">Amount: RM {project.amount.toLocaleString()}</span>
                        )}
                        <span>Created: {project.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                      </div>

                      {/* Action Buttons for Sales Projects */}
                      {project.status === 'sales' && permissions.canEdit && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleMoveToDesign(project.id!)}
                            className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm transition-colors"
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Move to Design
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {permissions.canEdit && (
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit project"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button
                          onClick={() => handleDeleteProject(project.id!)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {!permissions.canEdit && (
                        <div className="p-2 text-gray-300" title="Read-only access">
                          <Lock className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditForm && editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Project</h3>

              {/* Collaboration Banner */}
              <CollaborationBanner
                lock={lockOwner}
                isLockOwner={isLockOwner}
                presence={presence}
                onReleaseLock={closeEditForm}
                className="mb-4"
              />

              <form onSubmit={handleUpdateProject} className="space-y-4">
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

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    {submitting ? 'Updating...' : 'Update Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
            Project created and automatically moved to Design & Engineering!
          </div>
        )}
      </div>
    </div>
  );
};

// Component to show collaboration status for individual projects
const ProjectCollaborationStatus: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { currentUser } = useAuth();
  const { presence } = usePresence(projectId, 'project', currentUser);
  const { isLocked, lockOwner, isLockOwner } = useDocumentLock(projectId, 'project', currentUser);

  if (!isLocked && presence.length === 0) return null;

  return (
    <div className="mb-2">
      <CollaborationStatus
        lock={lockOwner}
        presence={presence}
        isLockOwner={isLockOwner}
        className="text-xs"
      />
    </div>
  );
};

export default SalesModule;
