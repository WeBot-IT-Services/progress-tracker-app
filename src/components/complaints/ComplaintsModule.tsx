import React, { useState, useEffect } from 'react';
import { MessageSquareX, Plus, AlertTriangle, CheckCircle, Clock, User, Eye, Edit, Upload, X, Image } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import { useAuth } from '../../contexts/AuthContext';
import { complaintsService, projectsService, fileService, type Complaint, type Project } from '../../services/firebaseService';
import { safeFormatDate } from '../../utils/dateUtils';

const ComplaintsModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'submit'>('list');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerName: '',
    projectId: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    department: 'sales' as 'sales' | 'designer' | 'production' | 'installation',
    images: [] as File[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    customerName: '',
    projectId: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'open' as 'open' | 'in-progress' | 'resolved',
    department: 'sales' as 'sales' | 'designer' | 'production' | 'installation',
    images: [] as File[]
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedComplaintForImages, setSelectedComplaintForImages] = useState<Complaint | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{[key: string]: boolean}>({});

  // Role-based filtering function - NOW OPEN FOR ALL USERS
  const filterComplaintsByRole = (complaints: Complaint[]) => {
    if (!currentUser?.uid) return complaints;

    // All users can now see all complaints (no role-based filtering)
    return complaints;
  };

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [complaintsData, projectsData] = await Promise.all([
          complaintsService.getComplaints(),
          projectsService.getProjects()
        ]);
        setComplaints(complaintsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSubmitting(true);

      // Handle image uploads if any
      let uploadedImageUrls: string[] = [];
      if (formData.images.length > 0) {
        console.log('📤 Uploading complaint images...');
        
        // Upload each image to Firebase Storage
        const uploadPromises = formData.images.map(async (file) => {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`${file.name} is not an image file`);
          }
          
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`${file.name} is too large. Maximum size is 5MB`);
          }
          
          // Upload to Firebase Storage
          const path = `complaints/temp-complaint-${Date.now()}/${file.name}`;
          return await fileService.uploadFile(file, path);
        });
        
        uploadedImageUrls = await Promise.all(uploadPromises);
        console.log('✅ Images uploaded successfully:', uploadedImageUrls);
      }

      const complaintData = {
        title: formData.title,
        description: formData.description,
        customerName: formData.customerName,
        projectId: formData.projectId,
        priority: formData.priority,
        status: 'open' as const,
        department: formData.department,
        createdBy: currentUser.uid,
        files: uploadedImageUrls // Use uploaded URLs instead of blob URLs
      };

      const complaintId = await complaintsService.createComplaint(complaintData);
      
      // If we have uploaded images, update the complaint with the correct path
      if (uploadedImageUrls.length > 0) {
        // Update the storage path to use the actual complaint ID
        const updatedImageUrls = await Promise.all(uploadedImageUrls.map(async (url, index) => {
          const file = formData.images[index];
          const newPath = `complaints/${complaintId}/${file.name}`;
          // For now, keep the existing URL since Firebase Storage doesn't support moving files easily
          // In a production app, you might want to re-upload with the correct path
          return url;
        }));
        
        // Update the complaint with final image URLs
        await complaintsService.updateComplaint(complaintId, {
          files: updatedImageUrls
        });
      }

      // Reload complaints
      const updatedComplaints = await complaintsService.getComplaints();
      setComplaints(updatedComplaints);

      setActiveView('list');
      setFormData({
        title: '',
        description: '',
        customerName: '',
        projectId: '',
        priority: 'medium',
        department: 'sales',
        images: []
      });
    } catch (error) {
      console.error('Error creating complaint:', error);
      alert(`Failed to create complaint: ${error.message}`);
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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  // Remove image from upload list
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Handle image upload for edit form
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEditFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  // Remove image from edit upload list
  const removeEditImage = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowViewModal(true);
  };

  const handleEditComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditFormData({
      title: complaint.title,
      description: complaint.description,
      customerName: complaint.customerName,
      projectId: complaint.projectId,
      priority: complaint.priority,
      status: complaint.status,
      department: complaint.department || 'sales',
      images: []
    });
    setShowEditModal(true);
  };

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !currentUser) return;

    try {
      setSubmitting(true);

      // Handle image uploads if any
      let newImageUrls: string[] = [];
      if (editFormData.images.length > 0) {
        console.log('📤 Uploading complaint images...');
        
        // Upload each image to Firebase Storage
        const uploadPromises = editFormData.images.map(async (file) => {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`${file.name} is not an image file`);
          }
          
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`${file.name} is too large. Maximum size is 5MB`);
          }
          
          // Upload to Firebase Storage
          const path = `complaints/${selectedComplaint.id}/${Date.now()}_${file.name}`;
          return await fileService.uploadFile(file, path);
        });
        
        newImageUrls = await Promise.all(uploadPromises);
        console.log('✅ Images uploaded successfully:', newImageUrls);
      }

      // Combine existing files with new uploads
      const existingFiles = selectedComplaint.files || [];
      const updatedFiles = [...existingFiles, ...newImageUrls];

      await complaintsService.updateComplaint(selectedComplaint.id!, {
        title: editFormData.title,
        description: editFormData.description,
        customerName: editFormData.customerName,
        projectId: editFormData.projectId,
        priority: editFormData.priority,
        status: editFormData.status,
        department: editFormData.department,
        files: updatedFiles
      });

      // Reload complaints
      const updatedComplaints = await complaintsService.getComplaints();
      setComplaints(updatedComplaints);

      setShowEditModal(false);
      setSelectedComplaint(null);
      alert('Complaint updated successfully!');
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle image upload for existing complaints
  const handleImageUploadForComplaint = async (complaintId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(prev => ({ ...prev, [complaintId]: true }));
      
      console.log('📤 Uploading complaint images...');
      
      // Upload each image to Firebase Storage
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }
        
        // Upload to Firebase Storage
        const path = `complaints/${complaintId}/${Date.now()}_${file.name}`;
        return await fileService.uploadFile(file, path);
      });
      
      const newImageUrls = await Promise.all(uploadPromises);
      console.log('✅ Images uploaded successfully:', newImageUrls);
      
      // Update the complaint with new images
      const complaint = complaints.find(c => c.id === complaintId);
      if (complaint) {
        const updatedFiles = [...(complaint.files || []), ...newImageUrls];
        await complaintsService.updateComplaint(complaintId, {
          files: updatedFiles
        });
        
        // Reload complaints to show updated images
        const updatedComplaints = await complaintsService.getComplaints();
        setComplaints(updatedComplaints);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Failed to upload images: ${error.message}`);
    } finally {
      setUploadingImages(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  // Delete image from complaint
  const deleteImageFromComplaint = async (complaintId: string, imageUrl: string, imageIndex: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // Find the complaint
      const complaint = complaints.find(c => c.id === complaintId);
      if (!complaint) {
        throw new Error('Complaint not found');
      }

      // Remove the image from the files array
      const updatedFiles = (complaint.files || []).filter((_, index) => index !== imageIndex);
      
      // Update the complaint in Firestore
      await complaintsService.updateComplaint(complaintId, {
        files: updatedFiles
      });

      // Try to delete the image from Firebase Storage
      try {
        // Extract the file path from the Firebase Storage URL
        const urlParts = imageUrl.split('/');
        const filePathStartIndex = urlParts.findIndex(part => part.includes('complaints'));
        if (filePathStartIndex !== -1) {
          const filePath = urlParts.slice(filePathStartIndex).join('/').split('?')[0];
          // Decode the URL-encoded path
          const decodedPath = decodeURIComponent(filePath);
          await fileService.deleteFile(decodedPath);
          console.log('✅ Image deleted from Firebase Storage');
        }
      } catch (storageError) {
        console.warn('⚠️ Could not delete image from storage:', storageError);
        // Continue anyway - the image reference is removed from the complaint
      }

      // Reload complaints to show updated images
      const updatedComplaints = await complaintsService.getComplaints();
      setComplaints(updatedComplaints);

      // Update the selected complaint if it's being viewed
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        const updatedComplaint = updatedComplaints.find(c => c.id === complaintId);
        if (updatedComplaint) {
          setSelectedComplaint(updatedComplaint);
        }
      }

      // Update the selected complaint for images modal
      if (selectedComplaintForImages && selectedComplaintForImages.id === complaintId) {
        const updatedComplaint = updatedComplaints.find(c => c.id === complaintId);
        if (updatedComplaint) {
          setSelectedComplaintForImages(updatedComplaint);
        }
      }

      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Failed to delete image: ${error.message}`);
    }
  };

  const filteredComplaints = filterComplaintsByRole(complaints);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'sales':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'designer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'installation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Check if user can edit this specific complaint
  const canEditComplaint = (complaint: Complaint) => {
    if (!currentUser) return false;

    // Admin can edit all complaints
    if (currentUser.role === 'admin') return true;

    // Sales can edit all complaints (as they handle customer relations)
    if (currentUser.role === 'sales') return true;

    // Users can edit complaints they created
    if (complaint.createdBy === currentUser.uid) return true;

    return false;
  };

  return (
    <>
      <ModuleContainer
        title="Complaints"
        subtitle="Manage customer complaints and feedback - Open for all users"
        icon={MessageSquareX}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-red-500 to-red-600"
        className="bg-gradient-to-br from-red-50 via-white to-orange-50"
      maxWidth="7xl"
      fullViewport={true}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 mb-6 shadow-sm border border-white/50">
          <div className="flex">
            <button
              onClick={() => setActiveView('list')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'list'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              📋 View Complaints
            </button>
            <button
              onClick={() => setActiveView('submit')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                activeView === 'submit'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Complaint
            </button>
          </div>
        </div>

        {/* View Complaints Tab */}
        {activeView === 'list' && (
          <div className="space-y-6">
            {/* Complaints List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading complaints...</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquareX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No complaints found</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or submit a new complaint</p>
                </div>
              ) : (
                filteredComplaints.map((complaint) => (
                  <div key={complaint.id} className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="flex items-start space-x-6 p-6">
                      {/* Main Content */}
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                              {complaint.title}
                            </h4>
                            <p className="text-gray-600 mt-1 leading-relaxed">{complaint.description}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                              {complaint.status === 'open' ? '🔴 OPEN' :
                               complaint.status === 'in-progress' ? '🟡 IN PROGRESS' :
                               '🟢 RESOLVED'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority === 'high' ? '🔴 HIGH' :
                               complaint.priority === 'medium' ? '🟡 MEDIUM' :
                               '🟢 LOW'}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                            <div className="bg-blue-500 p-3 rounded-xl shadow-sm">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Customer</p>
                              <p className="font-bold text-blue-900 text-lg">{complaint.customerName}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                            <div className="bg-purple-500 p-3 rounded-xl shadow-sm">
                              <MessageSquareX className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Project</p>
                              <p className="font-bold text-purple-900 text-lg truncate">
                                {projects.find(p => p.id === complaint.projectId)?.name || 'Unknown Project'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
                            <div className={`p-3 rounded-xl shadow-sm ${
                              complaint.department === 'sales' ? 'bg-green-500' :
                              complaint.department === 'designer' ? 'bg-blue-500' :
                              complaint.department === 'production' ? 'bg-orange-500' :
                              'bg-purple-500'
                            }`}>
                              <div className={`w-5 h-5 rounded-full bg-white`} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Department</p>
                              <p className="font-bold text-emerald-900 text-lg">
                                {complaint.department ? 
                                  complaint.department.charAt(0).toUpperCase() + complaint.department.slice(1) : 
                                  'Sales'
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                            <div className="bg-gray-500 p-3 rounded-xl shadow-sm">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Created</p>
                              <p className="font-bold text-gray-900 text-lg">{safeFormatDate(complaint.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Images Section */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                              <Image className="w-4 h-4 mr-2" />
                              Images {complaint.files && complaint.files.length > 0 && `(${complaint.files.length})`}
                            </h5>
                            <button
                              onClick={() => {
                                setSelectedComplaintForImages(complaint);
                                setShowImageModal(true);
                              }}
                              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg text-sm font-medium"
                            >
                              <Image className="w-4 h-4" />
                              <span>View Images</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Permission Badge */}
                        {!canEditComplaint(complaint) && (
                          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300 shadow-sm">
                            <Eye className="w-4 h-4 mr-2" />
                            VIEW ONLY ACCESS
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-3 ml-8">
                        <button
                          onClick={() => handleViewComplaint(complaint)}
                          className="group/btn p-4 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-200 hover:shadow-lg hover:scale-110 border-2 border-transparent hover:border-blue-200"
                          title="View Details"
                        >
                          <Eye className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        {canEditComplaint(complaint) && (
                          <button
                            onClick={() => handleEditComplaint(complaint)}
                            className="group/btn p-4 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all duration-200 hover:shadow-lg hover:scale-110 border-2 border-transparent hover:border-green-200"
                            title="Edit Complaint"
                          >
                            <Edit className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Subtle hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Submit Complaint Tab */}
        {activeView === 'submit' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submit New Complaint</h3>
                <p className="text-sm text-gray-600">Create a new complaint record</p>
              </div>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Complaint Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Detailed Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none"
                    placeholder="Please provide detailed information about the complaint"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Related Project *
                  </label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Priority Level
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Assign to Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    required
                  >
                    <option value="sales">Sales Department</option>
                    <option value="designer">Design Department</option>
                    <option value="production">Production Department</option>
                    <option value="installation">Installation Department</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Attach Supporting Images
                </label>
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="bg-red-100 p-3 rounded-full mb-3">
                          <Upload className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="mb-2 text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      title: '',
                      description: '',
                      customerName: '',
                      projectId: '',
                      priority: 'medium',
                      department: 'sales',
                      images: []
                    });
                    setActiveView('list');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-xl transition-all duration-200 font-medium flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Complaint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ModuleContainer>

    {/* Modals - Rendered outside ModuleContainer for proper layering */}
    
    {/* Enhanced View Complaint Modal */}
    {showViewModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Complaint Details</h3>
                      <p className="text-blue-100 text-sm">View complaint information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedComplaint(null);
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Status & Priority Banner */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedComplaint.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedComplaint.status)}`}>
                          {selectedComplaint.status === 'open' ? '🔴 OPEN' :
                           selectedComplaint.status === 'in-progress' ? '🟡 IN PROGRESS' :
                           '🟢 RESOLVED'}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority === 'high' ? '🔴 HIGH' :
                         selectedComplaint.priority === 'medium' ? '🟡 MEDIUM' :
                         '🟢 LOW'} PRIORITY
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDepartmentColor(selectedComplaint.department || 'sales')}`}>
                      {selectedComplaint.department ? selectedComplaint.department.charAt(0).toUpperCase() + selectedComplaint.department.slice(1) + ' Department' : 'Sales Department'}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Complaint Title</label>
                    <h4 className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-xl">{selectedComplaint.title}</h4>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-900 whitespace-pre-line leading-relaxed">{selectedComplaint.description}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Customer Information</label>
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <p className="text-blue-900 font-medium">{selectedComplaint.customerName}</p>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <label className="block text-sm font-semibold text-purple-700 mb-2">Related Project</label>
                      <div className="flex items-center space-x-2">
                        <MessageSquareX className="w-5 h-5 text-purple-600" />
                        <p className="text-purple-900 font-medium">
                          {projects.find(p => p.id === selectedComplaint.projectId)?.name || 'Unknown Project'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <label className="block text-sm font-semibold text-green-700 mb-2">Created Date</label>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <p className="text-green-900 font-medium">
                          {safeFormatDate(selectedComplaint.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-xl">
                      <label className="block text-sm font-semibold text-orange-700 mb-2">Complaint ID</label>
                      <div className="flex items-center space-x-2">
                        <MessageSquareX className="w-5 h-5 text-orange-600" />
                        <p className="text-orange-900 font-medium font-mono text-sm">
                          {selectedComplaint.id?.substring(0, 8) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Images Section */}
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-purple-800 flex items-center">
                        <Image className="w-5 h-5 mr-2" />
                        Attached Images ({selectedComplaint.files?.length || 0})
                      </h4>
                      <button
                        onClick={() => {
                          setSelectedComplaintForImages(selectedComplaint);
                          setShowImageModal(true);
                        }}
                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg text-sm font-medium"
                      >
                        <Image className="w-4 h-4" />
                        <span>Manage Images</span>
                      </button>
                    </div>
                    
                    {selectedComplaint.files && selectedComplaint.files.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedComplaint.files.slice(0, 4).map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Complaint image ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-all cursor-pointer"
                              onClick={() => window.open(image, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                        {selectedComplaint.files.length > 4 && (
                          <div className="flex items-center justify-center bg-purple-100 border-2 border-dashed border-purple-300 rounded-lg h-20 text-purple-600 font-medium text-sm">
                            +{selectedComplaint.files.length - 4} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
                        <Image className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                        <p className="text-purple-600 text-sm">No images attached</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions - Fixed Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl flex-shrink-0">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedComplaint(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all font-medium"
                >
                  Close
                </button>
                {canEditComplaint(selectedComplaint) && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditComplaint(selectedComplaint);
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-xl transition-all font-medium flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Complaint
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Edit Complaint Modal */}
        {showEditModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Edit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Edit Complaint</h3>
                      <p className="text-green-100 text-sm">Update complaint information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedComplaint(null);
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleUpdateComplaint} className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Complaint Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={editFormData.title}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={editFormData.customerName}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Related Project *
                      </label>
                      <select
                        name="projectId"
                        value={editFormData.projectId}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                        required
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.projectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Priority Level
                      </label>
                      <select
                        name="priority"
                        value={editFormData.priority}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="low">🟢 Low Priority</option>
                        <option value="medium">🟡 Medium Priority</option>
                        <option value="high">🔴 High Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Status
                      </label>
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="open">🔴 Open</option>
                        <option value="in-progress">🟡 In Progress</option>
                        <option value="resolved">🟢 Resolved</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Assign to Department
                      </label>
                      <select
                        name="department"
                        value={editFormData.department}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                        required
                      >
                        <option value="sales">Sales Department</option>
                        <option value="designer">Design Department</option>
                        <option value="production">Production Department</option>
                        <option value="installation">Installation Department</option>
                      </select>
                    </div>
                  </div>

                  {/* Enhanced Image Upload Section */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Attach Supporting Images
                    </label>
                    <div className="space-y-4">
                      {/* Upload Button */}
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="bg-green-100 p-3 rounded-full mb-3">
                              <Upload className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="mb-2 text-sm text-gray-600">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleEditImageUpload}
                          />
                        </label>
                      </div>

                      {/* Enhanced Image Preview */}
                      {editFormData.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {editFormData.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeEditImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>                    </div>
                  </div>

                  {/* Enhanced Form Actions - Fixed Footer */}
                  <div className="flex space-x-4 p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedComplaint(null);
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-xl transition-all duration-200 font-medium flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Complaint
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Image Viewing Modal */}
        {showImageModal && selectedComplaintForImages && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">View Images</h3>
                      <p className="text-blue-100 text-sm">{selectedComplaintForImages.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowImageModal(false);
                      setSelectedComplaintForImages(null);
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Images Display Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Image className="w-5 h-5 mr-2" />
                      Attached Images ({selectedComplaintForImages.files?.length || 0})
                    </h4>
                    
                    {selectedComplaintForImages.files && selectedComplaintForImages.files.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedComplaintForImages.files.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Complaint image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                              onClick={() => window.open(image, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-2">
                              <button
                                onClick={() => window.open(image, '_blank')}
                                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all"
                                title="View Image"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteImageFromComplaint(selectedComplaintForImages.id, image, index)}
                                className="bg-red-500/70 hover:bg-red-600/80 text-white p-2 rounded-lg transition-all"
                                title="Delete Image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No images attached</p>
                        <p className="text-gray-400 text-sm">This complaint has no images attached</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions - Fixed Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl flex-shrink-0">
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedComplaintForImages(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default ComplaintsModule;
