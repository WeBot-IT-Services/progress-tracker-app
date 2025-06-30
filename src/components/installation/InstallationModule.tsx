import React, { useState, useEffect } from 'react';
import { Hammer, Camera, CheckCircle, Image, Lock, ArrowRight, Calendar, Clock } from 'lucide-react';
import ModuleHeader from '../common/ModuleHeader';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, fileService, type Project } from '../../services/firebaseService';
import { workflowService } from '../../services/workflowService';
import { getModulePermissions } from '../../utils/permissions';
import { firebaseLogin } from '../../services/firebaseAuth';

const InstallationModule: React.FC = () => {
  const { currentUser, isFirebaseMode, isLocalMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'wip' | 'history'>('wip');
  const [wipProjects, setWipProjects] = useState<Project[]>([]);
  const [historyProjects, setHistoryProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);


  // Get user permissions
  const permissions = getModulePermissions(currentUser?.role || 'installation', 'installation');

  // Force Firebase authentication for photo uploads
  const forceFirebaseLogin = async () => {
    try {
      // Use demo installation credentials
      const installationEmail = 'installation@mysteel.com';
      const installationPassword = 'MS2024!Install#Super';

      console.log('🔥 Attempting Firebase login...');
      await firebaseLogin(installationEmail, installationPassword);
      console.log('✅ Firebase login successful!');
      alert('Successfully logged in with Firebase! You can now upload photos.');
      window.location.reload(); // Refresh to update auth state
    } catch (error) {
      console.error('❌ Firebase login failed:', error);
      alert('Firebase login failed. Please check console for details.');
    }
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  // Load projects from Firebase with real-time updates
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const allProjects = await projectsService.getProjects();

        // WIP: Projects in installation status
        const wipProjectsData = allProjects.filter(project => project.status === 'installation');

        // History: Completed projects
        const historyProjectsData = allProjects.filter(project => project.status === 'completed');

        console.log(`📊 Installation Module - WIP Projects: ${wipProjectsData.length}, History: ${historyProjectsData.length}`);
        setWipProjects(wipProjectsData);
        setHistoryProjects(historyProjectsData);
      } catch (error) {
        console.error('Error loading installation projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    // Set up real-time listener for project updates
    const unsubscribe = projectsService.onProjectsChange ? projectsService.onProjectsChange((projects) => {
      console.log(`🔄 Installation Module - Real-time update received: ${projects.length} total projects`);

      // Filter for installation projects
      const wipProjectsData = projects.filter(project => project.status === 'installation');
      const historyProjectsData = projects.filter(project => project.status === 'completed');

      console.log(`📊 Installation Module - Updated WIP: ${wipProjectsData.length}, History: ${historyProjectsData.length}`);
      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);
      setLoading(false);
    }) : null;

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);



  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photos || !selectedProject || !currentUser || !permissions.canEdit) return;

    try {
      setUploadingPhotos(true);

      // Debug logging
      console.log('🔍 Upload Debug Info:');
      console.log('Current User:', currentUser);
      console.log('User Role:', currentUser.role);
      console.log('Permissions:', permissions);
      console.log('Selected Project:', selectedProject.id);

      // Check Firebase Auth state
      const { auth } = await import('../../config/firebase');
      console.log('🔥 Firebase Auth State:');
      console.log('Auth current user:', auth?.currentUser);
      console.log('Auth UID:', auth?.currentUser?.uid);
      console.log('Auth email:', auth?.currentUser?.email);
      console.log('🔧 Auth Mode:');
      console.log('Firebase Mode:', isFirebaseMode);
      console.log('Local Mode:', isLocalMode);

      // If not authenticated with Firebase, show error
      if (!auth?.currentUser) {
        console.error('❌ Not authenticated with Firebase Auth!');
        alert('You are not authenticated with Firebase. Please log in with a Firebase account to upload photos.');
        return;
      }
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const uploadPromises = Array.from(photos).map(async (photo) => {
        // Simplified path structure compatible with current storage rules: installation/projectId/filename
        // Include date info in filename for organization
        const timestamp = Date.now();
        const datePrefix = currentDate.replace(/-/g, ''); // YYYYMMDD format
        const fileName = `${datePrefix}_${timestamp}_${photo.name}`;
        const filePath = `installation/${selectedProject.id}/${fileName}`;
        return await fileService.uploadFile(photo, filePath);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update project with photo URLs and metadata
      const currentFiles = selectedProject.files || [];
      const photoMetadata = uploadedUrls.map(url => ({
        url,
        date: currentDate,
        uploadedBy: currentUser.uid,
        uploadedAt: new Date().toISOString()
      }));

      await projectsService.updateProject(selectedProject.id!, {
        files: [...currentFiles, ...uploadedUrls],
        photoMetadata: [...(selectedProject.photoMetadata || []), ...photoMetadata]
      });

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project => project.status === 'installation');
      setWipProjects(wipProjectsData);

      setShowPhotoUpload(false);
      setPhotos(null);
      alert('Photos uploaded successfully with date organization!');
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };





  const handleProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !progressUpdate.trim() || !permissions.canEdit) return;

    try {
      // Add progress update to project
      const currentNotes = selectedProject.installationData?.notes || '';
      const timestamp = new Date().toLocaleString();
      const newNote = `[${timestamp}] ${progressUpdate}`;
      const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;

      await projectsService.updateProject(selectedProject.id!, {
        'installationData.notes': updatedNotes,
        'installationData.lastModified': new Date()
      });

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project => project.status === 'installation');
      setWipProjects(wipProjectsData);

      setShowProgressModal(false);
      setSelectedProject(null);
      setProgressUpdate('');
      alert('Progress updated successfully!');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  const handleRollbackToInstallation = async (projectId: string) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to rollback projects.');
      return;
    }

    try {
      await projectsService.updateProject(projectId, {
        status: 'installation',
        progress: 75
      });

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project => project.status === 'installation');
      const historyProjectsData = allProjects.filter(project => project.status === 'completed');

      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);

      alert('Project rolled back to installation phase!');
    } catch (error) {
      console.error('Error rolling back project:', error);
      alert('Failed to rollback project. Please try again.');
    }
  };

  const handleCompleteInstallation = async (projectId: string, deliveryDate?: Date) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to complete installations.');
      return;
    }

    if (!confirm('Mark this installation as completed?')) return;

    try {
      // Use workflow service for automatic completion
      await workflowService.transitionInstallationToCompleted(projectId, deliveryDate);

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project => project.status === 'installation');
      const historyProjectsData = allProjects.filter(project => project.status === 'completed');

      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);

      alert('Installation completed successfully with delivery date tracking!');
    } catch (error) {
      console.error('Error completing installation:', error);
      alert('Failed to complete installation. Please try again.');
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <ModuleHeader
        title="Installation"
        subtitle="Manage installation progress and photo uploads"
        icon={Hammer}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-purple-500 to-purple-600"
      >
        {selectedProject && (
          <button
            onClick={() => setShowPhotoUpload(true)}
            className="flex items-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Camera className="w-4 h-4 mr-2" />
            Upload Photos
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
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              🔨 WIP (Installation)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
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
                <p className="text-gray-600">You do not have permission to view installation projects.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading installation projects...</p>
              </div>
            ) : wipProjects.length === 0 ? (
              <div className="text-center py-12">
                <Hammer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No installation projects found</p>
                <p className="text-sm text-gray-500 mt-2">Projects from production will appear here for installation</p>
              </div>
            ) : (
              wipProjects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.projectName}</h3>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>Due: {new Date(project.completionDate).toLocaleDateString()}</span>
                        <span>Progress: {project.progress || 0}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>

                      {/* Photo Gallery */}
                      {project.files && project.files.length > 0 && (
                        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowPhotoViewer(true);
                            }}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                          >
                            <Image className="w-4 h-4 mr-1" />
                            View Photos ({project.files.length})
                          </button>
                        </div>
                      )}



                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {permissions.canEdit && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowPhotoUpload(true);
                              }}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              Upload Photos
                            </button>
                            <button
                              onClick={() => handleCompleteInstallation(project.id!, new Date())}
                              className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Complete
                            </button>
                          </>
                        )}
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
                <p className="text-gray-600">You do not have permission to view installation history.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading installation history...</p>
              </div>
            ) : historyProjects.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed installations found</p>
              </div>
            ) : (
              historyProjects.map((project) => (
                <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.projectName}</h3>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>Completed: {new Date(project.completionDate).toLocaleDateString()}</span>
                      </div>

                      {/* Photo Gallery for History */}
                      {project.files && project.files.length > 0 && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowPhotoViewer(true);
                            }}
                            className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                          >
                            <Image className="w-4 h-4 mr-1" />
                            View Photos ({project.files.length})
                          </button>
                        </div>
                      )}

                      {/* Rollback Options */}
                      {permissions.canEdit && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to rollback this project to installation? This will move it back to the installation phase.')) {
                                handleRollbackToInstallation(project.id!);
                              }
                            }}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                          >
                            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                            Rollback to Installation
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

        {/* Photo Viewer Modal */}
        {showPhotoViewer && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Installation Photos
              </h3>
              <p className="text-gray-600 mb-4">
                Project: <span className="font-medium">{selectedProject.projectName}</span>
              </p>

              {/* Photo Gallery - Organized by Date and Milestone */}
              <div className="space-y-4 mb-6">
                {!selectedProject.files || selectedProject.files.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No photos uploaded yet</p>
                ) : (
                  (() => {
                    // Group photos by date
                    const photoGroups: { [key: string]: { files: string[], metadata: any[] } } = {};

                    selectedProject.files.forEach((fileUrl, index) => {
                      const metadata = selectedProject.photoMetadata?.[index];
                      const date = metadata?.date || 'Unknown Date';

                      if (!photoGroups[date]) {
                        photoGroups[date] = { files: [], metadata: [] };
                      }
                      photoGroups[date].files.push(fileUrl);
                      photoGroups[date].metadata.push(metadata);
                    });

                    return (
                      <div className="space-y-6">
                        {Object.entries(photoGroups).map(([date, group]) => (
                          <div key={date} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">
                                {new Date(date).toLocaleDateString()}
                              </h4>
                                <span className="text-sm text-gray-500">
                                  {group.files.length} photo{group.files.length !== 1 ? 's' : ''}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.files.map((fileUrl, index) => (
                                  <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                                    <img
                                      src={fileUrl}
                                      alt={`Installation photo ${index + 1}`}
                                      className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(fileUrl, '_blank')}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                                      }}
                                    />
                                    <div className="p-2">
                                      <p className="text-xs text-gray-600">Photo {index + 1}</p>
                                      {group.metadata[index] && (
                                        <p className="text-xs text-gray-500">
                                          Uploaded by: {group.metadata[index].uploadedBy}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowPhotoViewer(false);
                    setSelectedProject(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Photo Upload Modal */}
        {showPhotoUpload && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Installation Photos
              </h3>
              <p className="text-gray-600 mb-4">
                Project: <span className="font-medium">{selectedProject.projectName}</span>
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
                    Photos will be organized by date automatically
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
                Project: <span className="font-medium">{selectedProject.projectName}</span>
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

        {/* Photo Viewer Modal */}
        {showPhotoViewer && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Installation Photos - {selectedProject.projectName}
                </h3>
                <button
                  onClick={() => {
                    setShowPhotoViewer(false);
                    setSelectedProject(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedProject.files && selectedProject.files.length > 0 ? (
                <div>
                  {/* Photo Organization by Date and Milestone */}
                  {selectedProject.photoMetadata && selectedProject.photoMetadata.length > 0 ? (
                    <div className="space-y-6">
                      {(() => {
                        // Group photos by date
                        const photosByDate = selectedProject.photoMetadata.reduce((acc: any, photo: any, index: number) => {
                          const date = photo.date || 'Unknown Date';
                          if (!acc[date]) acc[date] = [];
                          acc[date].push({
                            ...photo,
                            url: selectedProject.files![index] || photo.url
                          });
                          return acc;
                        }, {});

                        return Object.entries(photosByDate)
                          .sort(([a], [b]) => new Date(b as string).getTime() - new Date(a as string).getTime())
                          .map(([date, photos]: [string, any]) => (
                            <div key={date} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                                {new Date(date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </h4>

                              {/* Group by milestone within the date */}
                              {(() => {
                                const photosByMilestone = photos.reduce((acc: any, photo: any) => {
                                  const milestone = photo.milestoneId || 'General';
                                  if (!acc[milestone]) acc[milestone] = [];
                                  acc[milestone].push(photo);
                                  return acc;
                                }, {});

                                return Object.entries(photosByMilestone).map(([milestone, milestonePhotos]: [string, any]) => (
                                  <div key={milestone} className="mb-4 last:mb-0">
                                    <h5 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                                      <Clock className="w-4 h-4 mr-1 text-blue-500" />
                                      {milestone === 'General' ? 'General Photos' : `Milestone: ${milestone}`}
                                    </h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {milestonePhotos.map((photo: any, photoIndex: number) => (
                                        <div key={photoIndex} className="relative group">
                                          <img
                                            src={photo.url}
                                            alt={`Installation photo ${photoIndex + 1}`}
                                            className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => window.open(photo.url, '_blank')}
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                              </svg>
                                            </div>
                                          </div>
                                          {photo.uploadedAt && (
                                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                                              {new Date(photo.uploadedAt).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          ));
                      })()}
                    </div>
                  ) : (
                    // Fallback for projects without metadata
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedProject.files.map((fileUrl: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={fileUrl}
                            alt={`Installation photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => window.open(fileUrl, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No photos available for this project</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallationModule;
