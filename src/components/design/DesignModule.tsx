import React, { useState, useEffect } from 'react';
import { Wrench, Check, Upload, CheckCircle, FileText } from 'lucide-react';
import ModuleHeader from '../common/ModuleHeader';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, fileService, type Project } from '../../services/firebaseService';

const DesignModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'completed'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  // Load projects from Firebase
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const [dneProjects, completedProjectsData] = await Promise.all([
          projectsService.getProjectsByStatus('DNE'),
          projectsService.getProjectsByStatus('Completed')
        ]);
        setProjects(dneProjects);
        setCompletedProjects(completedProjectsData);
      } catch (error) {
        console.error('Error loading design projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: 'Production' | 'Completed') => {
    try {
      await projectsService.updateProject(projectId, {
        status: newStatus,
        progress: newStatus === 'Completed' ? 100 : 50
      });

      // Reload projects
      const [dneProjects, completedProjectsData] = await Promise.all([
        projectsService.getProjectsByStatus('DNE'),
        projectsService.getProjectsByStatus('Completed')
      ]);
      setProjects(dneProjects);
      setCompletedProjects(completedProjectsData);

      console.log(`Updated project ${projectId} to ${newStatus}`);
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Failed to update project status. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || !selectedProject || !currentUser) return;

    try {
      setUploadingFile(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const filePath = `design/${selectedProject.id}/${Date.now()}_${file.name}`;
        return await fileService.uploadFile(file, filePath);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update project with file URLs
      const currentFiles = selectedProject.files || [];
      await projectsService.updateProject(selectedProject.id!, {
        files: [...currentFiles, ...uploadedUrls]
      });

      // Reload projects
      const updatedProjects = await projectsService.getProjectsByStatus('DNE');
      setProjects(updatedProjects);

      setShowFileUpload(false);
      setFiles(null);
      setSelectedProject(null);
      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploadingFile(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ModuleHeader
        title="Design & Engineering"
        subtitle="Manage design projects and completion status"
        icon={Wrench}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-blue-500 to-blue-600"
      >
        {selectedProject && (
          <button
            onClick={() => setShowFileUpload(true)}
            className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </button>
        )}
      </ModuleHeader>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 mb-6 shadow-sm border border-white/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'projects'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Design Projects (DNE)
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Completed Projects
            </button>
          </div>
        </div>

        {/* Design Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading design projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No design projects found</p>
                <p className="text-sm text-gray-500 mt-2">Projects with DNE status will appear here</p>
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
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>Due: {new Date(project.completionDate).toLocaleDateString()}</span>
                        <span>Progress: {project.progress || 0}%</span>
                        {project.files && project.files.length > 0 && (
                          <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {project.files.length} files
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Files
                        </button>
                        <button
                          onClick={() => handleStatusChange(project.id!, 'Production')}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Move to Production
                        </button>
                        <button
                          onClick={() => handleStatusChange(project.id!, 'Completed')}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <Check className="w-4 h-4 mr-1" />
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

        {/* Completed Projects Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading completed projects...</p>
              </div>
            ) : completedProjects.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed projects found</p>
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
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span>Completed: {new Date(project.completionDate).toLocaleDateString()}</span>
                        <span>Progress: {project.progress || 100}%</span>
                        {project.files && project.files.length > 0 && (
                          <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {project.files.length} files
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 100}%` }}
                        ></div>
                      </div>

                      {/* Files Display */}
                      {project.files && project.files.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Design Files:</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.files.map((fileUrl, index) => (
                              <a
                                key={index}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                File {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* File Upload Modal */}
        {showFileUpload && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Design Files
              </h3>
              <p className="text-gray-600 mb-4">
                Project: <span className="font-medium">{selectedProject.name}</span>
              </p>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Files
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: PDF, DWG, Images, Documents
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFileUpload(false);
                      setSelectedProject(null);
                      setFiles(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingFile || !files}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    {uploadingFile ? 'Uploading...' : 'Upload Files'}
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

export default DesignModule;
