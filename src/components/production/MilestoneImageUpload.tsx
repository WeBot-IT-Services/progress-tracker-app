import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader, Lock, Eye } from 'lucide-react';
import { fileService } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { type ModulePermissions } from '../../utils/permissions';
import ImageModal from '../common/ImageModal';

interface MilestoneImageUploadProps {
  milestoneId: string;
  projectId: string;
  existingImages?: MilestoneImage[];
  onImagesUpdated: (images: MilestoneImage[]) => void;
  permissions: ModulePermissions;
}

interface MilestoneImage {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: Date | string | any; // Allow Firestore timestamps
  uploadedBy: string;
}

const MilestoneImageUpload: React.FC<MilestoneImageUploadProps> = ({
  milestoneId,
  projectId,
  existingImages = [],
  onImagesUpdated,
  permissions
}) => {
  const { currentUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [images, setImages] = useState<MilestoneImage[]>(existingImages);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check authentication
    if (!currentUser) {
      alert('You must be logged in to upload images.');
      return;
    }

    // Check permissions
    if (!permissions.canEdit) {
      alert('You do not have permission to upload images.');
      return;
    }

    console.log('🔐 Current user:', currentUser);
    console.log('📁 Upload path will be:', `projects/${projectId}/milestones/${milestoneId}/`);

    setUploading(true);
    try {
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
        const path = `projects/${projectId}/milestones/${milestoneId}/${Date.now()}_${file.name}`;
        console.log('📤 Uploading to path:', path);
        const url = await fileService.uploadFile(file, path);
        console.log('✅ Upload successful, URL:', url);

        const newImage: MilestoneImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          uploadedAt: new Date(),
          uploadedBy: currentUser?.name || currentUser?.email || 'Unknown User'
        };

        return newImage;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const updatedImages = [...images, ...uploadedImages];
      
      setImages(updatedImages);
      onImagesUpdated(updatedImages);

      alert(`${uploadedImages.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      
      // Enhanced error debugging
      console.log('🔍 Upload Error Debug Info:');
      console.log('Error type:', error.constructor.name);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Current user:', currentUser);
      console.log('Project ID:', projectId);
      console.log('Milestone ID:', milestoneId);
      
      // Check Firebase Auth state
      const { auth } = await import('../../config/firebase');
      console.log('🔥 Firebase Auth Debug:');
      console.log('Auth current user:', auth?.currentUser);
      console.log('Auth UID:', auth?.currentUser?.uid);
      console.log('Auth email:', auth?.currentUser?.email);
      console.log('Auth token valid:', auth?.currentUser?.accessToken ? 'Yes' : 'No');
      
      if (error.code === 'storage/unauthorized') {
        alert(`Storage permission denied! Debug info:
        
User: ${currentUser?.email || 'Not logged in'}
Project: ${projectId}
Milestone: ${milestoneId}
Auth State: ${auth?.currentUser ? 'Authenticated' : 'Not authenticated'}

Please check:
1. You are logged in with a valid account
2. Your user document exists in Firestore
3. Firebase Storage rules allow your user role

Try logging out and logging back in.`);
      } else {
        alert(`Failed to upload images: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = async (imageId: string) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to remove images.');
      return;
    }

    if (!confirm('Are you sure you want to remove this image?')) return;

    try {
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      onImagesUpdated(updatedImages);
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image');
    }
  };

  const updateCaption = async (imageId: string, caption: string) => {
    if (!permissions.canEdit) {
      return; // Silently prevent caption updates if no permission
    }

    try {
      const updatedImages = images.map(img => 
        img.id === imageId ? { ...img, caption } : img
      );
      setImages(updatedImages);
      onImagesUpdated(updatedImages);
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {permissions.canEdit ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-gray-600">Uploading images...</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">
                Drag and drop images here, or{' '}
                <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                  browse files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                Supports: JPG, PNG, GIF (max 5MB each)
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">
            You do not have permission to upload images
          </p>
          <p className="text-xs text-gray-500">
            Only users with production module edit permissions can upload milestone images
          </p>
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Milestone Images ({images.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.caption || 'Milestone image'}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setShowImageModal(true);
                    }}
                  />
                </div>
                
                {/* Hover overlay with view button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setShowImageModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg"
                    title="View full size"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Remove button */}
                {permissions.canEdit && (
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Caption input */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder={permissions.canEdit ? "Add caption..." : "Caption (read-only)"}
                    value={image.caption || ''}
                    onChange={(e) => updateCaption(image.id, e.target.value)}
                    disabled={!permissions.canEdit}
                    className={`w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                      !permissions.canEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Upload info */}
                <div className="mt-1 text-xs text-gray-500">
                  {(() => {
                    try {
                      if (!image.uploadedAt) {
                        return 'Date unavailable';
                      }
                      
                      let dateObj: Date;
                      
                      if (image.uploadedAt instanceof Date) {
                        dateObj = image.uploadedAt;
                      } else if (typeof image.uploadedAt === 'string') {
                        dateObj = new Date(image.uploadedAt);
                      } else if (image.uploadedAt && typeof image.uploadedAt === 'object' && 'toDate' in image.uploadedAt) {
                        // Handle Firestore timestamp
                        dateObj = (image.uploadedAt as any).toDate();
                      } else {
                        return 'Date unavailable';
                      }
                      
                      if (isNaN(dateObj.getTime())) {
                        return 'Date unavailable';
                      }
                      
                      return dateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                    } catch (error) {
                      console.error('Error formatting date:', error, image.uploadedAt);
                      return 'Date unavailable';
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No images uploaded yet</p>
          <p className="text-xs">Upload images to track milestone progress</p>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={images.map(img => ({
          id: img.id,
          url: img.url,
          caption: img.caption,
          uploadedAt: img.uploadedAt,
          uploadedBy: img.uploadedBy
        }))}
        initialIndex={selectedImageIndex}
        title="Milestone Images"
      />
    </div>
  );
};

export default MilestoneImageUpload;
