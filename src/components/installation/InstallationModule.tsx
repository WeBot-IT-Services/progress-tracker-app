import React, { useState, useEffect } from 'react';
import { Hammer, Camera, CheckCircle, Edit, Image } from 'lucide-react';
import ModuleHeader from '../common/ModuleHeader';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, fileService, type Project } from '../../services/firebaseService';

const InstallationModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'completed'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Load projects from Firebase
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const [installationProjects, completedProjectsData] = await Promise.all([
          projectsService.getProjectsByStatus('Installation'),
          projectsService.getProjectsByStatus('Completed')
        ]);
        setProjects(installationProjects);
        setCompletedProjects(completedProjectsData);
      } catch (error) {
        console.error('Error loading installation projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photos || !selectedProject || !currentUser) return;

    try {
      setUploadingPhotos(true);
      const uploadPromises = Array.from(photos).map(async (photo) => {
        const filePath = `installation/${selectedProject.id}/${Date.now()}_${photo.name}`;
        return await fileService.uploadFile(photo, filePath);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update project with photo URLs
      const currentFiles = selectedProject.files || [];
      await projectsService.updateProject(selectedProject.id!, {
        files: [...currentFiles, ...uploadedUrls]
      });

      // Reload projects
      const updatedProjects = await projectsService.getProjectsByStatus('Installation');
      setProjects(updatedProjects);

      setShowPhotoUpload(false);
      setPhotos(null);
      setSelectedProject(null);
      alert('Photos uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !progressUpdate.trim()) return;

    try {
      // Add progress update to project description or create a progress log
      const currentDescription = selectedProject.description || '';
      const timestamp = new Date().toLocaleString();
      const newDescription = `${currentDescription}\n\n[${timestamp}] Installation Update: ${progressUpdate}`;

      await projectsService.updateProject(selectedProject.id!, {
        description: newDescription
      });

      // Reload projects
      const updatedProjects = await projectsService.getProjectsByStatus('Installation');
      setProjects(updatedProjects);

      setShowProgressModal(false);
      setProgressUpdate('');
      setSelectedProject(null);
      alert('Progress update added successfully!');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  const handleCompleteInstallation = async (projectId: string) => {
    if (!confirm('Mark this installation as completed?')) return;

    try {
      await projectsService.updateProject(projectId, {
        status: 'Completed',
        progress: 100
      });

      // Reload projects
      const [installationProjects, completedProjectsData] = await Promise.all([
        projectsService.getProjectsByStatus('Installation'),
        projectsService.getProjectsByStatus('Completed')
      ]);
      setProjects(installationProjects);
      setCompletedProjects(completedProjectsData);

      alert('Installation marked as completed!');
    } catch (error) {
      console.error('Error completing installation:', error);
      alert('Failed to complete installation. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Installation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <ModuleHeader
        title="Installation Module"
        subtitle="Manage installation progress and photo uploads"
        icon={Hammer}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-purple-500 to-purple-600"
      >
        {selectedProject && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="flex items-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              <Camera className="w-4 h-4 mr-2" />
              Upload Photos
            </button>
            <button
              onClick={() => setShowProgressModal(true)}
              className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Progress
            </button>
          </div>
        )}
      </ModuleHeader>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 mb-6 shadow-sm border border-white/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'projects'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Installation Projects
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Completed Installations
            </button>
          </div>
        </div>

        {/* Installation Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading installation projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Hammer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No installation projects found</p>
                <p className="text-sm text-gray-500 mt-2">Projects ready for installation will appear here</p>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <div className="text-gray-600 mb-3">
                          <p className="whitespace-pre-line">{project.description}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>Due: {new Date(project.completionDate).toLocaleDateString()}</span>
                        <span>Progress: {project.progress || 0}%</span>
                        {project.files && project.files.length > 0 && (
                          <span className="flex items-center">
                            <Image className="w-4 h-4 mr-1" />
                            {project.files.length} photos
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          Upload Photos
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProgressModal(true);
                          }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update Progress
                        </button>
                        <button
                          onClick={() => handleCompleteInstallation(project.id!)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Completed Installations Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading completed installations...</p>
              </div>
            ) : completedProjects.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed installations found</p>
              </div>
            ) : (
              completedProjects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <div className="text-gray-600 mb-3">
                          <p className="whitespace-pre-line">{project.description}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>Completed: {new Date(project.completionDate).toLocaleDateString()}</span>
                        <span>Progress: {project.progress || 100}%</span>
                        {project.files && project.files.length > 0 && (
                          <span className="flex items-center">
                            <Image className="w-4 h-4 mr-1" />
                            {project.files.length} photos
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Photo Upload Modal */}
        {showPhotoUpload && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Installation Photos
              </h3>
              <p className="text-gray-600 mb-4">
                Project: <span className="font-medium">{selectedProject.name}</span>
              </p>

              <form onSubmit={handlePhotoUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Photos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setPhotos(e.target.files)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload daily installation progress photos
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoUpload(false);
                      setSelectedProject(null);
                      setPhotos(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhotos || !photos}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Progress Update Modal */}
        {showProgressModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Update Installation Progress
              </h3>
              <p className="text-gray-600 mb-4">
                Project: <span className="font-medium">{selectedProject.name}</span>
              </p>

              <form onSubmit={handleProgressUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress Update
                  </label>
                  <textarea
                    value={progressUpdate}
                    onChange={(e) => setProgressUpdate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the installation progress..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProgressModal(false);
                      setSelectedProject(null);
                      setProgressUpdate('');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!progressUpdate.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    Update Progress
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

export default InstallationModule;
