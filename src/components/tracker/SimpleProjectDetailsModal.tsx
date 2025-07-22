import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Image,
  Wrench,
  Hammer,
  Building,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { type Project, type Milestone, milestonesService } from '../../services/firebaseService';
import { canViewAmount } from '../../utils/permissions';
import { safeFormatDate } from '../../utils/dateUtils';

interface SimpleProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
}

const SimpleProjectDetailsModal: React.FC<SimpleProjectDetailsModalProps> = ({ project, onClose }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'milestones'>('overview');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  const userRole = currentUser?.role || 'sales';
  const canViewAmountField = canViewAmount(userRole);

  // Load milestones when modal opens
  useEffect(() => {
    const loadMilestones = async () => {
      if (!project.id) return;

      setLoadingMilestones(true);
      try {
        const projectMilestones = await milestonesService.getMilestonesByProject(project.id);
        setMilestones(projectMilestones);
      } catch (error) {
        console.error('Error loading milestones:', error);
        setMilestones([]);
      } finally {
        setLoadingMilestones(false);
      }
    };

    loadMilestones();
  }, [project.id]);

  // Get module icon
  const getModuleIcon = (status: string) => {
    switch (status) {
      case 'sales': return <DollarSign className="w-5 h-5" />;
      case 'dne': return <FileText className="w-5 h-5" />;
      case 'production': return <Wrench className="w-5 h-5" />;
      case 'installation': return <Hammer className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      default: return <Building className="w-5 h-5" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sales': return 'bg-green-100 text-green-800 border-green-200';
      case 'dne': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'installation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to get milestone images with metadata
  const getMilestoneImagesWithMetadata = (milestone: Milestone): Array<{url: string, metadata?: any, index: number}> => {
    const imagesWithMetadata: Array<{url: string, metadata?: any, index: number}> = [];
    let currentIndex = 0;

    // Check milestone.images array
    if (milestone.images && Array.isArray(milestone.images)) {
      milestone.images.forEach(url => {
        imagesWithMetadata.push({ url, metadata: null, index: currentIndex++ });
      });
    }

    // Check milestone.files array for image files
    if (milestone.files && Array.isArray(milestone.files)) {
      const imageFiles = milestone.files.filter(file => {
        if (typeof file === 'string') {
          return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file) ||
                 file.includes('firebasestorage.googleapis.com');
        } else if (file && typeof file === 'object' && (file as any).url) {
          return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test((file as any).url) ||
                 (file as any).url.includes('firebasestorage.googleapis.com');
        }
        return false;
      });

      imageFiles.forEach(file => {
        const url = typeof file === 'string' ? file : (file as any).url;
        const metadata = typeof file === 'object' ? file : null;
        imagesWithMetadata.push({ url, metadata, index: currentIndex++ });
      });
    }

    // Check milestone.photoMetadata for additional images with metadata
    if ((milestone as any).photoMetadata && Array.isArray((milestone as any).photoMetadata)) {
      (milestone as any).photoMetadata.forEach((photo: any) => {
        if (photo.url && typeof photo.url === 'string') {
          imagesWithMetadata.push({ url: photo.url, metadata: photo, index: currentIndex++ });
        }
      });
    }

    // Remove duplicates by URL
    const uniqueImages = imagesWithMetadata.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    );

    return uniqueImages;
  };

  // Helper function to get milestone images (legacy function for backward compatibility)
  const getMilestoneImages = (milestone: Milestone): string[] => {
    return getMilestoneImagesWithMetadata(milestone).map(item => item.url);
  };

  // Helper function to get project-level images for a specific module
  const getProjectModuleImages = (module: 'production' | 'installation'): string[] => {
    const images: string[] = [];

    // Check project files array for relevant images
    if (project.files && Array.isArray(project.files)) {
      const moduleImages = project.files.filter(file => {
        if (typeof file === 'string') {
          return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file) ||
                 file.includes('firebasestorage.googleapis.com');
        }
        return false;
      });
      images.push(...moduleImages);
    }

    // Check module-specific data
    const moduleData = module === 'production' ? project.productionData : project.installationData;
    if (moduleData) {
      // Check photoMetadata
      if ((moduleData as any).photoMetadata && Array.isArray((moduleData as any).photoMetadata)) {
        const photoUrls = (moduleData as any).photoMetadata
          .map((photo: any) => photo.url)
          .filter((url: string) => url && typeof url === 'string');
        images.push(...photoUrls);
      }

      // Check files array
      if ((moduleData as any).files && Array.isArray((moduleData as any).files)) {
        const moduleFiles = (moduleData as any).files.filter(file => {
          if (typeof file === 'string') {
            return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file) ||
                   file.includes('firebasestorage.googleapis.com');
          }
          return false;
        });
        images.push(...moduleFiles);
      }
    }

    // Remove duplicates
    return [...new Set(images)];
  };

  // Get project module images with metadata
  const getProjectModuleImagesWithMetadata = (module: 'production' | 'installation'): Array<{url: string, metadata?: any, index: number}> => {
    const imagesWithMetadata: Array<{url: string, metadata?: any, index: number}> = [];

    // Check project files array for relevant images
    if (project.files && Array.isArray(project.files)) {
      const moduleImages = project.files.filter(file => {
        if (typeof file === 'string') {
          return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file) ||
                 file.includes('firebasestorage.googleapis.com');
        }
        return false;
      });
      
      moduleImages.forEach((url, index) => {
        imagesWithMetadata.push({
          url,
          metadata: null,
          index
        });
      });
    }

    // Check module-specific data
    const moduleData = module === 'production' ? project.productionData : project.installationData;
    if (moduleData) {
      // Check photoMetadata
      if ((moduleData as any).photoMetadata && Array.isArray((moduleData as any).photoMetadata)) {
        (moduleData as any).photoMetadata.forEach((photo: any, index: number) => {
          if (photo.url && typeof photo.url === 'string') {
            imagesWithMetadata.push({
              url: photo.url,
              metadata: photo,
              index: imagesWithMetadata.length
            });
          }
        });
      }

      // Check files array
      if ((moduleData as any).files && Array.isArray((moduleData as any).files)) {
        (moduleData as any).files.forEach((file: any, index: number) => {
          if (typeof file === 'string') {
            if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file) ||
                file.includes('firebasestorage.googleapis.com')) {
              imagesWithMetadata.push({
                url: file,
                metadata: null,
                index: imagesWithMetadata.length
              });
            }
          }
        });
      }
    }

    // Remove duplicates by URL
    const uniqueImages = imagesWithMetadata.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    );

    return uniqueImages;
  };

  // Render milestone images gallery
  const renderMilestoneImages = (milestone: Milestone) => {
    const imagesWithMetadata = getMilestoneImagesWithMetadata(milestone);

    if (imagesWithMetadata.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Image className="w-4 h-4 mr-1" />
          Milestone Images ({imagesWithMetadata.length})
        </h6>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imagesWithMetadata.map((imageItem, index) => {
            const { url: imageUrl, metadata } = imageItem;
            
            return (
              <div key={index} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`${milestone.title || (milestone as any).name} - Image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                    onError={(e) => {
                      // Replace with placeholder on error
                      const target = e.currentTarget;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyVjdBMiAyIDAgMCAwIDE5IDVINUEyIDIgMCAwIDAgMyA3VjE3QTIgMiAwIDAgMCA1IDE5SDE5QTIgMiAwIDAgMCAyMSAxN1YxMloiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjIiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTIxIDE1TDE2IDEwTDUgMjEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                      target.className = 'w-full h-full object-contain p-4 opacity-50';
                      target.style.cursor = 'default';
                      target.onclick = null;
                    }}
                    loading="lazy"
                  />
                </div>
                
                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                
                {/* Image index indicator */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {index + 1}
                </div>

                {/* Metadata information */}
                {metadata && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <div className="space-y-1 text-xs text-gray-600">
                      {metadata.uploadedAt && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Uploaded:</span>
                          <span className="ml-1">{safeFormatDate(metadata.uploadedAt, 'Unknown date')}</span>
                        </div>
                      )}
                      {metadata.uploadedBy && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">By:</span>
                          <span className="ml-1">{metadata.uploadedBy}</span>
                        </div>
                      )}
                      {metadata.date && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Date:</span>
                          <span className="ml-1">{metadata.date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Basic metadata fallback when no structured metadata is available */}
                {!metadata && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500 text-center">
                      Photo #{index + 1}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render module-level images gallery
  const renderModuleImages = (module: 'production' | 'installation', title: string) => {
    const imagesWithMetadata = getProjectModuleImagesWithMetadata(module);

    if (imagesWithMetadata.length === 0) {
      return null;
    }

    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Image className="w-4 h-4 mr-1" />
          {title} Images ({imagesWithMetadata.length})
        </h6>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imagesWithMetadata.map((imageItem, index) => {
            const { url: imageUrl, metadata } = imageItem;
            
            return (
              <div key={index} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`${title} - Image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                    onError={(e) => {
                      // Replace with placeholder on error
                      const target = e.currentTarget;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyVjdBMiAyIDAgMCAwIDE5IDVINUEyIDIgMCAwIDAgMyA3VjE3QTIgMiAwIDAgMCA1IDE5SDE5QTIgMiAwIDAgMCAyMSAxN1YxMloiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjIiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTIxIDE1TDE2IDEwTDUgMjEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                      target.className = 'w-full h-full object-contain p-4 opacity-50';
                      target.style.cursor = 'default';
                      target.onclick = null;
                    }}
                    loading="lazy"
                  />
                </div>
                
                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                
                {/* Image index indicator */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {index + 1}
                </div>

                {/* Metadata information */}
                {metadata && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <div className="space-y-1 text-xs text-gray-600">
                      {metadata.uploadedAt && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Uploaded:</span>
                          <span className="ml-1">{safeFormatDate(metadata.uploadedAt, 'Unknown date')}</span>
                        </div>
                      )}
                      {metadata.uploadedBy && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">By:</span>
                          <span className="ml-1">{metadata.uploadedBy}</span>
                        </div>
                      )}
                      {metadata.date && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Date:</span>
                          <span className="ml-1">{metadata.date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Basic metadata fallback when no structured metadata is available */}
                {!metadata && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500 text-center">
                      Photo #{index + 1}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Project Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Project Name</label>
            <p className="text-lg font-semibold text-gray-900">{project.projectName}</p>
          </div>
          
          {project.description && (
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900">{project.description}</p>
            </div>
          )}
          
          {canViewAmountField && (
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg font-semibold text-gray-900">
                RM {project.amount?.toLocaleString() || 'N/A'}
              </p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
              {getModuleIcon(project.status)}
              <span className="ml-2 capitalize">{project.status}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Delivery Date</label>
            <p className="text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              {safeFormatDate(project.deliveryDate || project.estimatedCompletionDate)}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Created By</label>
            <p className="text-gray-900 flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              {project.createdBy || 'Unknown'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Created Date</label>
            <p className="text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              {safeFormatDate(project.createdAt)}
            </p>
          </div>
          
          {project.progress !== undefined && (
            <div>
              <label className="text-sm font-medium text-gray-500">Progress</label>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Files Section */}
      {project.files && project.files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Project Files ({project.files.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.files.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={file}
                  alt={`Project file ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.open(file, '_blank')}
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
      )}
    </div>
  );

  // Render modules tab
  const renderModulesTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Module Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Module */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-6 h-6 text-green-600 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900">Sales</h4>
          </div>
          {project.salesData ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Submitted By:</strong> {(project.salesData as any).submittedBy || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Submitted At:</strong> {safeFormatDate((project.salesData as any).submittedAt)}
              </p>
              {(project.salesData as any).notes && (
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {(project.salesData as any).notes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No sales data available</p>
          )}
        </div>

        {/* Design Module */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900">Design & Engineering</h4>
          </div>
          {project.designData ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Status:</strong>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  project.designData.status === 'completed' ? 'bg-green-100 text-green-800' :
                  project.designData.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.designData.status}
                </span>
              </p>
              {(project.designData as any).assignedTo && (
                <p className="text-sm text-gray-600">
                  <strong>Assigned To:</strong> {(project.designData as any).assignedTo}
                </p>
              )}
              {project.designData.completedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Completed At:</strong> {safeFormatDate(project.designData.completedAt)}
                </p>
              )}
              {(project.designData as any).notes && (
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {(project.designData as any).notes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No design data available</p>
          )}
        </div>

        {/* Production Module */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Wrench className="w-6 h-6 text-orange-600 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900">Production</h4>
          </div>
          {project.productionData ? (
            <div className="space-y-2">
              {(project.productionData as any).assignedBy && (
                <p className="text-sm text-gray-600">
                  <strong>Assigned By:</strong> {(project.productionData as any).assignedBy}
                </p>
              )}
              {project.productionData.assignedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Assigned At:</strong> {safeFormatDate(project.productionData.assignedAt)}
                </p>
              )}
              {project.productionData.completedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Completed At:</strong> {safeFormatDate(project.productionData.completedAt)}
                </p>
              )}
              {project.productionData.deliveryDate && (
                <p className="text-sm text-gray-600">
                  <strong>Delivery Date:</strong> {safeFormatDate(project.productionData.deliveryDate)}
                </p>
              )}
              {(project.productionData as any).notes && (
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {(project.productionData as any).notes}
                </p>
              )}
              {/* Show milestone count from loaded milestones */}
              {milestones.filter(m => m.module === 'production' || !m.module).length > 0 && (
                <p className="text-sm text-gray-600">
                  <strong>Milestones:</strong> {milestones.filter(m => m.module === 'production' || !m.module).length} milestones
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No production data available</p>
          )}
        </div>

        {/* Installation Module */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Hammer className="w-6 h-6 text-purple-600 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900">Installation</h4>
          </div>
          {project.installationData ? (
            <div className="space-y-2">
              {project.installationData.assignedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Assigned At:</strong> {safeFormatDate(project.installationData.assignedAt)}
                </p>
              )}
              {project.installationData.completedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Completed At:</strong> {safeFormatDate(project.installationData.completedAt)}
                </p>
              )}
              {project.installationData.notes && (
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {project.installationData.notes}
                </p>
              )}
              {/* Show milestone count from loaded milestones */}
              {milestones.filter(m => m.module === 'installation').length > 0 && (
                <p className="text-sm text-gray-600">
                  <strong>Milestones:</strong> {milestones.filter(m => m.module === 'installation').length} milestones
                </p>
              )}
              {project.installationData.milestoneProgress && Object.keys(project.installationData.milestoneProgress).length > 0 && (
                <p className="text-sm text-gray-600">
                  <strong>Milestone Progress:</strong> {Object.keys(project.installationData.milestoneProgress).length} milestones tracked
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No installation data available</p>
          )}
        </div>
      </div>
    </div>
  );

  // Render milestones tab
  const renderMilestonesTab = () => {
    const productionMilestones = milestones.filter(m => m.module === 'production' || !m.module);
    const installationMilestones = milestones.filter(m => m.module === 'installation');

    if (loadingMilestones) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading milestones...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Project Milestones</h3>

        {/* Production Milestones */}
        {productionMilestones.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Wrench className="w-5 h-5 text-orange-600 mr-2" />
              Production Milestones ({productionMilestones.length})
            </h4>
            <div className="space-y-4">
              {productionMilestones.map((milestone, index) => (
                <div key={milestone.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-gray-900">{milestone.title || (milestone as any).name}</h5>
                      {getMilestoneImages(milestone).length > 0 && (
                        <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          <Image className="w-3 h-3 mr-1" />
                          {getMilestoneImages(milestone).length}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                      milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {milestone.status || 'pending'}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                    {milestone.startDate && (
                      <span>Start: {safeFormatDate(milestone.startDate)}</span>
                    )}
                    {milestone.dueDate && (
                      <span>Due: {safeFormatDate(milestone.dueDate)}</span>
                    )}
                    {milestone.completedDate && (
                      <span>Completed: {safeFormatDate(milestone.completedDate)}</span>
                    )}
                    {milestone.progress !== undefined && (
                      <span>Progress: {milestone.progress}%</span>
                    )}
                    {milestone.assignedTo && (
                      <span>Assigned to: {milestone.assignedTo}</span>
                    )}
                  </div>
                  {/* Milestone Images */}
                  {renderMilestoneImages(milestone)}
                </div>
              ))}
            </div>
            {/* Production Module Images */}
            {renderModuleImages('production', 'Production Module')}
          </div>
        )}

        {/* Installation Milestones */}
        {installationMilestones.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Hammer className="w-5 h-5 text-purple-600 mr-2" />
              Installation Milestones ({installationMilestones.length})
            </h4>
            <div className="space-y-4">
              {installationMilestones.map((milestone, index) => (
                <div key={milestone.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-gray-900">{milestone.title || (milestone as any).name}</h5>
                      {getMilestoneImages(milestone).length > 0 && (
                        <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          <Image className="w-3 h-3 mr-1" />
                          {getMilestoneImages(milestone).length}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                      milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {milestone.status || 'pending'}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                    {milestone.startDate && (
                      <span>Start: {safeFormatDate(milestone.startDate)}</span>
                    )}
                    {milestone.dueDate && (
                      <span>Due: {safeFormatDate(milestone.dueDate)}</span>
                    )}
                    {milestone.completedDate && (
                      <span>Completed: {safeFormatDate(milestone.completedDate)}</span>
                    )}
                    {milestone.progress !== undefined && (
                      <span>Progress: {milestone.progress}%</span>
                    )}
                    {milestone.assignedTo && (
                      <span>Assigned to: {milestone.assignedTo}</span>
                    )}
                  </div>
                  {/* Milestone Images */}
                  {renderMilestoneImages(milestone)}
                </div>
              ))}
            </div>
            {/* Installation Module Images */}
            {renderModuleImages('installation', 'Installation Module')}
          </div>
        )}

        {/* Installation Milestone Progress (legacy data) */}
        {project.installationData?.milestoneProgress && Object.keys(project.installationData.milestoneProgress).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Hammer className="w-5 h-5 text-purple-600 mr-2" />
              Installation Progress Tracking
            </h4>
            <div className="space-y-4">
              {Object.entries(project.installationData.milestoneProgress).map(([milestoneId, progress]) => (
                <div key={milestoneId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">{milestoneId}</h5>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (progress as any).status === 'completed' ? 'bg-green-100 text-green-800' :
                      (progress as any).status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(progress as any).status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {(progress as any).startedAt && (
                      <span>Started: {safeFormatDate((progress as any).startedAt)}</span>
                    )}
                    {(progress as any).completedAt && (
                      <span>Completed: {safeFormatDate((progress as any).completedAt)}</span>
                    )}
                  </div>
                  {(progress as any).notes && (
                    <p className="text-sm text-gray-600 mt-2">{(progress as any).notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No milestones message */}
        {productionMilestones.length === 0 && installationMilestones.length === 0 &&
         (!project.installationData?.milestoneProgress || Object.keys(project.installationData.milestoneProgress).length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No milestones yet</h4>
            <p className="text-gray-600">Milestones will appear here as they are created for this project</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{project.projectName}</h2>
              <p className="text-blue-100 mt-1">Project Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'modules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Modules
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'milestones'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Milestones
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'modules' && renderModulesTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
        </div>
      </div>
    </div>
  );
};

export default SimpleProjectDetailsModal;
