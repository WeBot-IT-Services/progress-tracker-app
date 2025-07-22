import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, Plus, Edit, Trash2, Save, X, Upload, Image, Eye } from 'lucide-react';
import Modal from '../common/Modal';
import ImageModal from '../common/ImageModal';
import { milestonesService, fileService, type Milestone } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

interface MilestoneFormData {
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate: string;
  dueDate: string;
  completionDate: string;
  assignedTo: string;
  progress: number;
}

const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}) => {
  const { currentUser } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    description: '',
    status: 'pending',
    startDate: '',
    dueDate: '',
    completionDate: '',
    assignedTo: '',
    progress: 0,
  });
  
  // Image handling state
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedMilestoneImages, setSelectedMilestoneImages] = useState<Array<{
    id: string;
    url: string;
    caption?: string;
  }>>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Load milestones when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadMilestones();
    }
  }, [isOpen, projectId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const projectMilestones = await milestonesService.getMilestonesByProject(projectId);
      setMilestones(projectMilestones);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      startDate: '',
      dueDate: '',
      completionDate: '',
      assignedTo: '',
      progress: 0,
    });
    setSelectedImages(null);
    setShowAddForm(false);
    setEditingMilestone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploadingImages(true);
      
      // Upload images if selected
      let imageUrls: string[] = [];
      if (selectedImages && selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          const imageUrl = await fileService.uploadFile(file, `milestones/${projectId}/${Date.now()}_${file.name}`);
          imageUrls.push(imageUrl);
        }
      }
      
      // Prepare milestone data, excluding undefined values
      const milestoneData: any = {
        projectId,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        progress: formData.progress,
        module: 'production' as const,
      };

      // Only add optional fields if they have values
      if (formData.startDate) {
        milestoneData.startDate = new Date(formData.startDate);
      }
      if (formData.dueDate) {
        milestoneData.dueDate = new Date(formData.dueDate);
      }
      if (formData.completionDate) {
        milestoneData.completionDate = new Date(formData.completionDate);
      }
      if (formData.assignedTo && formData.assignedTo.trim()) {
        milestoneData.assignedTo = formData.assignedTo.trim();
      }
      if (imageUrls.length > 0) {
        milestoneData.images = imageUrls;
      }

      if (editingMilestone) {
        // For updates, merge with existing images if no new images uploaded
        if (imageUrls.length === 0) {
          const existingMilestone = milestones.find(m => m.id === editingMilestone);
          if (existingMilestone?.images && existingMilestone.images.length > 0) {
            milestoneData.images = existingMilestone.images;
          }
        }
        await milestonesService.updateMilestone(editingMilestone, milestoneData);
      } else {
        await milestonesService.createMilestone(milestoneData);
      }

      await loadMilestones();
      resetForm();
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert('Error saving milestone. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setFormData({
      title: milestone.title,
      description: milestone.description,
      status: milestone.status,
      startDate: milestone.startDate ? milestone.startDate.toISOString().split('T')[0] : '',
      dueDate: milestone.dueDate ? milestone.dueDate.toISOString().split('T')[0] : '',
      completionDate: milestone.completionDate ? milestone.completionDate.toISOString().split('T')[0] : '',
      assignedTo: milestone.assignedTo || '',
      progress: milestone.progress || 0,
    });
    setEditingMilestone(milestone.id!);
    setShowAddForm(true);
  };

  const handleDelete = async (milestoneId: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        await milestonesService.deleteMilestone(milestoneId);
        await loadMilestones();
      } catch (error) {
        console.error('Error deleting milestone:', error);
        alert('Error deleting milestone. Please try again.');
      }
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-100';
      case 'in-progress': return 'text-amber-600 bg-amber-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Milestone Management`}
      subtitle={`Project: ${projectTitle}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Add Milestone Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Milestone
          </button>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {formData.status === 'completed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Employee name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestone Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSelectedImages(e.target.files)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Select multiple images to upload with this milestone
                  </p>
                  {selectedImages && selectedImages.length > 0 && (
                    <p className="text-sm text-amber-600 mt-2">
                      {selectedImages.length} image(s) selected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploadingImages}
                  className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                >
                  {uploadingImages ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      {editingMilestone ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingMilestone ? 'Update' : 'Save'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Milestones List */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Existing Milestones</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading milestones...</p>
            </div>
          ) : milestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No milestones found for this project.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                          {milestone.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Start: {formatDate(milestone.startDate)}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Due: {formatDate(milestone.dueDate)}</span>
                        </div>
                        {milestone.assignedTo && (
                          <div className="flex items-center text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            <span>{milestone.assignedTo}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>{milestone.progress || 0}%</span>
                        </div>
                      </div>

                      {milestone.progress && milestone.progress > 0 && (
                        <div className="mt-3">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${milestone.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Milestone Images */}
                      {milestone.images && milestone.images.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Image className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Images ({milestone.images.length})
                            </span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {milestone.images.slice(0, 3).map((imageUrl, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  const imageArray = milestone.images!.map((url, idx) => ({
                                    id: `${milestone.id}-${idx}`,
                                    url: url,
                                    caption: `Milestone: ${milestone.title}`
                                  }));
                                  setSelectedMilestoneImages(imageArray);
                                  setSelectedImageIndex(index);
                                  setShowImageModal(true);
                                }}
                                className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-amber-400 transition-colors"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Milestone image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                            {milestone.images.length > 3 && (
                              <div className="w-16 h-16 rounded-lg border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium">
                                +{milestone.images.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(milestone)}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="Edit milestone"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(milestone.id!)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal for viewing images */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={selectedMilestoneImages}
        initialIndex={selectedImageIndex}
        title="Milestone Images"
      />
    </Modal>
  );
};

export default MilestoneModal;
