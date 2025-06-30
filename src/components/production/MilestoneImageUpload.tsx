import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { projectsService } from '../../services/firebaseService';

interface MilestoneImageUploadProps {
  milestoneId: string;
  projectId: string;
  existingImages?: MilestoneImage[];
  onImagesUpdated: (images: MilestoneImage[]) => void;
}

interface MilestoneImage {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

const MilestoneImageUpload: React.FC<MilestoneImageUploadProps> = ({
  milestoneId,
  projectId,
  existingImages = [],
  onImagesUpdated
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [images, setImages] = useState<MilestoneImage[]>(existingImages);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

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
        const url = await projectsService.uploadFile(file, path);

        const newImage: MilestoneImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          uploadedAt: new Date(),
          uploadedBy: 'current-user' // This should come from auth context
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
      alert(`Failed to upload images: ${error.message}`);
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

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Milestone Images ({images.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.caption || 'Milestone image'}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Caption input */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Add caption..."
                    value={image.caption || ''}
                    onChange={(e) => updateCaption(image.id, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Upload info */}
                <div className="mt-1 text-xs text-gray-500">
                  {image.uploadedAt.toLocaleDateString()}
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
    </div>
  );
};

export default MilestoneImageUpload;
