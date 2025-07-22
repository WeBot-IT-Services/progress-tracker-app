import React, { useState, useEffect } from 'react';
import { Hammer, Camera, CheckCircle, Image, Lock, ArrowRight, Calendar, Clock } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, fileService, type Project } from '../../services/firebaseService';
import { getModulePermissions, getUserIdentifier } from '../../utils/permissions';
import { safeFormatDate, formatDueDate, formatCompletionDate } from '../../utils/dateUtils';
import ImageModal from '../common/ImageModal';

const InstallationModule: React.FC = () => {
  const { currentUser } = useAuth();
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt?: Date | string;
    uploadedBy?: string;
  }>>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


  // Get user permissions
  const permissions = getModulePermissions(currentUser?.role || 'installation', 'installation');





  // Load projects from Firebase with real-time updates
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const allProjects = await projectsService.getProjects();

        // WIP: Projects that should appear in Installation
        // This includes:
        // 1. Projects with main status 'installation'
        // 2. Projects that have installationData (flowed from DNE partial completion)
        const wipProjectsData = allProjects.filter(project =>
          project.status === 'installation' || project.installationData
        );

        // History: Completed projects
        const historyProjectsData = allProjects.filter(project => project.status === 'completed');

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
      // Filter for installation projects - SAME LOGIC AS INITIAL LOAD
      const wipProjectsData = projects.filter(project =>
        project.status === 'installation' || project.installationData
      );
      const historyProjectsData = projects.filter(project => project.status === 'completed');

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



      // Check user authentication (Firestore-based)
      if (!currentUser) {
        console.error('Not authenticated!');
        alert('You must be logged in to upload photos.');
        return;
      }

      console.log('Upload Debug Info:');
      console.log('Current User:', currentUser);
      console.log('User Role:', currentUser.role);
      console.log('Permissions:', permissions);
      console.log('Selected Project:', selectedProject.id);
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
        uploadedBy: getUserIdentifier(currentUser),
        uploadedAt: new Date().toISOString()
      }));

      await projectsService.updateProject(selectedProject.id!, {
        files: [...currentFiles, ...uploadedUrls],
        photoMetadata: [...(selectedProject.photoMetadata || []), ...photoMetadata.map(meta => ({
          ...meta,
          uploadedAt: new Date(meta.uploadedAt)
        }))]
      });

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project =>
        project.status === 'installation' || project.installationData
      );
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
        installationData: {
          ...selectedProject.installationData,
          notes: updatedNotes,
          lastModified: new Date()
        }
      });

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project =>
        project.status === 'installation' || project.installationData
      );
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
      const wipProjectsData = allProjects.filter(project =>
        project.status === 'installation' || project.installationData
      );
      const historyProjectsData = allProjects.filter(project => project.status === 'completed');

      setWipProjects(wipProjectsData);
      setHistoryProjects(historyProjectsData);

      alert('Project rolled back to installation phase!');
    } catch (error) {
      console.error('Error rolling back project:', error);
      alert('Failed to rollback project. Please try again.');
    }
  };

  const handleCompleteInstallation = async (projectId: string) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to complete installations.');
      return;
    }

    // Validate that Production is completed before allowing installation completion
    try {
      const project = await projectsService.getProject(projectId);
      if (!project) {
        alert('Project not found.');
        return;
      }

      // Check if Production is completed
      if (!project.productionData?.completedAt) {
        alert('Cannot complete installation. Production must be completed first.');
        return;
      }

      if (!confirm('Mark this installation as completed?')) return;

      // Use workflow service for automatic completion
      await projectsService.updateProject(projectId, { status: 'completed' });
      console.log('Project transitioned to completed');

      // Reload projects
      const allProjects = await projectsService.getProjects();
      const wipProjectsData = allProjects.filter(project =>
        project.status === 'installation' || project.installationData
      );
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
    <>
      <ModuleContainer
        title="Installation"
        subtitle="Manage installation progress and photo uploads"
        icon={Hammer}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-purple-500 to-purple-600"
        className="bg-gradient-to-br from-purple-50 via-white to-pink-50"
        maxWidth="6xl"
        fullViewport={true}
      >
      {/* Content - No top padding needed, ModuleContainer handles positioning */}
      <div className="flex-1 flex flex-col min-h-0 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
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
              Manage Installation
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Installation History
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
                <div key={project.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.projectName}</h3>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>{formatDueDate(project.deliveryDate || project.completionDate)}</span>
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
                              // Prepare images for modal
                              const images = project.files?.map((url: string, index: number) => ({
                                id: `img-${index}`,
                                url,
                                caption: `Installation Photo ${index + 1}`,
                                uploadedAt: project.photoMetadata?.[index]?.uploadedAt || new Date(),
                                uploadedBy: project.photoMetadata?.[index]?.uploadedBy || 'Unknown'
                              })) || [];
                              
                              setSelectedImages(images);
                              setSelectedImageIndex(0);
                              setShowImageModal(true);
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
                              onClick={() => handleCompleteInstallation(project.id!)}
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
                <div key={project.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.projectName}</h3>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>{formatCompletionDate(project.deliveryDate || project.completionDate)}</span>
                      </div>

                      {/* Photo Gallery for History */}
                      {project.files && project.files.length > 0 && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <button
                            onClick={() => {
                              // Prepare images for modal
                              const images = project.files?.map((url: string, index: number) => ({
                                id: `img-${index}`,
                                url,
                                caption: `Installation Photo ${index + 1}`,
                                uploadedAt: project.photoMetadata?.[index]?.uploadedAt || new Date(),
                                uploadedBy: project.photoMetadata?.[index]?.uploadedBy || 'Unknown'
                              })) || [];
                              
                              setSelectedImages(images);
                              setSelectedImageIndex(0);
                              setShowImageModal(true);
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
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <div className="space-y-6">
                    {selectedProject.photoMetadata && selectedProject.photoMetadata.length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(selectedProject.photoMetadata.reduce((acc: any, photo: any, index: number) => {
                            const date = photo.date || 'Unknown Date';
                            if (!acc[date]) acc[date] = [];
                            acc[date].push({
                              ...photo,
                              url: selectedProject.files![index] || photo.url
                            });
                            return acc;
                          }, {}))
                          .sort(([a], [b]) => new Date(b as string).getTime() - new Date(a as string).getTime())
                          .map(([date, photos]: [string, any]) => (
                            <div key={date} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                                {safeFormatDate(date, 'Unknown Date', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </h4>

                              {/* Group by milestone within the date */}
                              {Object.entries(photos.reduce((acc: any, photo: any) => {
                                const milestone = photo.milestoneId || 'General';
                                if (!acc[milestone]) acc[milestone] = [];
                                acc[milestone].push(photo);
                                return acc;
                              }, {})).map(([milestone, milestonePhotos]: [string, any]) => (
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
                                          onClick={() => {
                                            // Prepare all photos for modal
                                            const allPhotos = milestonePhotos.map((p: any, idx: number) => ({
                                              id: `milestone-${milestone}-${idx}`,
                                              url: p.url,
                                              caption: `${milestone === 'General' ? 'General Photo' : `Milestone: ${milestone}`} ${idx + 1}`,
                                              uploadedAt: p.uploadedAt || new Date(),
                                              uploadedBy: p.uploadedBy || 'Unknown'
                                            }));
                                            setSelectedImages(allPhotos);
                                            setSelectedImageIndex(photoIndex);
                                            setShowImageModal(true);
                                          }}
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
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No photos uploaded yet</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowPhotoViewer(false);
                    setSelectedProject(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload Modal */}
        {showPhotoUpload && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhotos || !photos}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-md transition-all duration-200"
                  >
                    {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </ModuleContainer>

      {/* Progress Update Modal */}
      {showProgressModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!progressUpdate.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-md transition-all duration-200"
                  >
                    Update Progress
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={selectedImages}
        initialIndex={selectedImageIndex}
        title="Installation Photos"
      />
    </>
  );
};

export default InstallationModule;
