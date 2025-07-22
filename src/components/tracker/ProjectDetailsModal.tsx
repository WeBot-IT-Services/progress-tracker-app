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
  TrendingUp,
  Trash2,
  Edit3,
  Plus,
  MessageSquare,
  Flag,
  Eye,
  EyeOff,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { type Project, type Milestone, type Complaint, projectsService, milestonesService, complaintsService } from '../../services/firebaseService';
import { canViewAmount, getModulePermissions } from '../../utils/permissions';
import { safeFormatDate } from '../../utils/dateUtils';

interface ProjectWithMilestones extends Project {
  milestones?: Milestone[];
  daysInStage?: number;
  isOverdue?: boolean;
}

interface ProjectDetailsModalProps {
  project: ProjectWithMilestones;
  onClose: () => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, onClose }) => {
  const { currentUser } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'timeline' | 'modules' | 'complaints'>('overview');
  const [complaintsSubTab, setComplaintsSubTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [createdByName, setCreatedByName] = useState<string>('');

  // Helper function to detect if a file is an image
  const isImageFile = (file: any): boolean => {
    const url = typeof file === 'string' ? file : file?.url;
    if (!url) return false;
    
    // Check for Firebase Storage URLs (they're typically images in this context)
    if (url.includes('firebasestorage.googleapis.com')) return true;
    
    // Check for common image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);

  const userRole = currentUser?.role || 'sales';
  const canViewAmountField = canViewAmount(userRole);
  const isAdmin = userRole === 'admin';

  // Load milestones, complaints and user information
  useEffect(() => {
    const loadData = async () => {
      if (project.id) {
        try {
          setLoading(true);
          
          // Load milestones and complaints in parallel
          const [projectMilestones, projectComplaints] = await Promise.all([
            projectsService.getMilestonesByProject(project.id),
            complaintsService.getComplaints()
          ]);
          
          setMilestones(projectMilestones);
          
          // Filter complaints for this project
          const filteredComplaints = projectComplaints.filter(complaint => complaint.projectId === project.id);
          setComplaints(filteredComplaints);
          
          // Load creator name (now using employee names directly)
          if (project.createdBy) {
            // Since we're now using employee names directly, no need for complex formatting
            setCreatedByName(project.createdBy);
          }
        } catch (error) {
          console.error('Error loading project data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [project.id, project.createdBy]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get milestone status color
  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    switch (project.status) {
      case 'sales': return 10;
      case 'dne': return 30;
      case 'production': return 60;
      case 'installation': return 85;
      case 'completed': return 100;
      default: return 0;
    }
  };

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

  // Check if user can view module data
  const canViewModuleData = (module: string) => {
    if (isAdmin) return true;
    
    const permissions = getModulePermissions(userRole, module);
    return permissions.canView;
  };

  // Complaint management functions
  const canEditComplaintStatus = (complaint: Complaint) => {
    if (isAdmin) return true;
    return complaint.department === userRole;
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    try {
      setComplaintsLoading(true);
      await complaintsService.updateComplaint(complaintId, { status: newStatus });
      
      // Reload complaints
      const updatedComplaints = await complaintsService.getComplaints();
      const filteredComplaints = updatedComplaints.filter(complaint => complaint.projectId === project.id);
      setComplaints(filteredComplaints);
      
      console.log('Complaint status updated successfully');
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert('Failed to update complaint status');
    } finally {
      setComplaintsLoading(false);
    }
  };

  const deleteComplaint = async (complaintId: string) => {
    if (!isAdmin) {
      alert('Only administrators can delete complaints');
      return;
    }

    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      setComplaintsLoading(true);
      await complaintsService.deleteComplaint(complaintId);
      
      // Reload complaints
      const updatedComplaints = await complaintsService.getComplaints();
      const filteredComplaints = updatedComplaints.filter(complaint => complaint.projectId === project.id);
      setComplaints(filteredComplaints);
      
      console.log('Complaint deleted successfully');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint');
    } finally {
      setComplaintsLoading(false);
    }
  };

  const getComplaintStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats - Enhanced Modern Design */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="p-2 bg-red-100 rounded-lg mr-3">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          Project Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl border border-blue-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{milestones.length}</div>
            <div className="text-sm sm:text-base text-blue-700 font-semibold">Total Milestones</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 via-green-100 to-green-200 rounded-2xl border border-green-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
              {milestones.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-sm sm:text-base text-green-700 font-semibold">Completed</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 rounded-2xl border border-orange-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2">
              {milestones.filter(m => m.status === 'in-progress').length}
            </div>
            <div className="text-sm sm:text-base text-orange-700 font-semibold">In Progress</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 rounded-2xl border border-gray-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-gray-600 mb-2">
              {milestones.filter(m => m.status === 'pending').length}
            </div>
            <div className="text-sm sm:text-base text-gray-700 font-semibold">Pending</div>
          </div>
        </div>
      </div>

      {/* Enhanced Project Status Banner */}
      <div className="bg-gradient-to-r from-red-50 via-red-100 to-orange-50 rounded-2xl p-6 sm:p-8 border border-red-200 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-white rounded-xl shadow-md">
                {getModuleIcon(project.status)}
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-md ${getStatusColor(project.status)}`}>
                {project.status && typeof project.status === 'string' 
                  ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
                  : 'Unknown Status'}
              </span>
              {project.isOverdue && (
                <span className="px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium flex items-center space-x-1 animate-pulse shadow-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>Overdue</span>
                </span>
              )}
            </div>
            <p className="text-gray-700 font-medium">
              Current phase: <span className="text-red-600">{project.status && typeof project.status === 'string' 
                ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
                : 'Unknown Status'}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {project.daysInStage} days in current stage
            </p>
          </div>
          
          <div className="flex flex-col items-end text-right">
            <div className="text-sm font-medium text-gray-600 mb-3">Overall Progress</div>
            <div className="flex items-center space-x-4">
              <div className="w-36 bg-white/70 rounded-full h-4 shadow-inner border border-gray-200">
                <div
                  className={`h-4 rounded-full transition-all duration-700 shadow-md ${
                    project.status === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : project.isOverdue
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <span className="text-xl font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">
                {getProgressPercentage()}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Key Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">Delivery Date</div>
              <div className={`font-bold text-lg ${project.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {safeFormatDate(project.deliveryDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-orange-300 hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-sm">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">Days in Stage</div>
              <div className="font-bold text-lg text-gray-900">{project.daysInStage} days</div>
            </div>
          </div>
        </div>

        {canViewAmountField && project.amount && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-green-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-sm">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1">Project Amount</div>
                <div className="font-bold text-lg text-gray-900">RM {project.amount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-purple-300 hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-sm">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">Created By</div>
              <div className="font-bold text-lg text-gray-900">
                {createdByName || 'Unknown User'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-indigo-300 hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl shadow-sm">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">Priority</div>
              <div className={`font-bold text-lg ${
                project.priority === 'high' ? 'text-red-600' :
                project.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1) || 'Normal'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-gray-300 hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-sm">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">Created Date</div>
              <div className="font-bold text-lg text-gray-900">
                {safeFormatDate(project.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-500" />
          Recent Activity
        </h4>
        <div className="space-y-3">
          {milestones.slice(0, 3).map((milestone, index) => (
            <div key={milestone.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                milestone.status === 'completed' ? 'bg-green-500' :
                milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{milestone.title}</div>
                <div className="text-sm text-gray-500">
                  {milestone.status === 'completed' ? 'Completed' : 'In Progress'}
                  {milestone.completedDate && ` on ${safeFormatDate(milestone.completedDate)}`}
                </div>
              </div>
            </div>
          ))}
          {milestones.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No recent activity</p>
              <p className="text-sm text-gray-500 mt-1">Activity will appear here as milestones are updated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render milestones tab
  const renderMilestonesTab = () => (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Target className="w-6 h-6 mr-2 text-red-500" />
            Project Milestones
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} total
          </p>
        </div>
        
        {/* Quick Filter Summary */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">
            {milestones.filter(m => m.status === 'completed').length} completed
          </span>
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            {milestones.filter(m => m.status === 'in-progress').length} active
          </span>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full font-medium">
            {milestones.filter(m => m.status === 'pending').length} pending
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading milestones...</p>
        </div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No milestones yet</h4>
          <p className="text-gray-600 mb-1">Milestones will appear here as they are created</p>
          <p className="text-sm text-gray-500">Track project progress with detailed milestones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-red-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMilestoneStatusColor(milestone.status)}`}>
                      {milestone.status && typeof milestone.status === 'string' 
                        ? milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)
                        : 'Unknown Status'}
                    </span>
                  </div>

                  {milestone.description && (
                    <p className="text-gray-600 mb-4 leading-relaxed">{milestone.description}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {milestone.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Due: {safeFormatDate(milestone.dueDate)}
                        </span>
                      </div>
                    )}

                    {milestone.completedDate && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          Completed: {safeFormatDate(milestone.completedDate)}
                        </span>
                      </div>
                    )}

                    {milestone.assignedTo && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Assigned: {milestone.assignedTo}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Created: {safeFormatDate(milestone.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Progress bar */}
                  {milestone.progress !== undefined && (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-semibold text-gray-900">{milestone.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div
                            className={`h-3 rounded-full transition-all duration-700 ${
                              milestone.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              milestone.status === 'in-progress' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-400'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => {
                            setEditingComplaint(null);
                            setShowNewComplaintForm(true);
                          }}
                          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Complaint</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => {
                      setEditingComplaint(null);
                      setShowNewComplaintForm(true);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Complaint</span>
                  </button>
                </div>
              </div>

              {/* Complaints Section - Enhanced */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-md font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-red-500" />
                    Project Complaints
                  </h5>
                  {canViewModuleData('complaints') && (
                    <button
                      onClick={() => setActiveTab('complaints')}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View All Complaints
                    </button>
                  )}
                </div>

                {complaints.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No complaints yet. Complaints will appear here as they are reported.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map(complaint => (
                      <div key={complaint.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              complaint.status === 'resolved' ? 'bg-green-500' :
                              complaint.status === 'in-progress' ? 'bg-blue-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-900">
                              {complaint.title}
                            </span>
                          </div>
                          <div className="text-xs font-semibold rounded-full px-3 py-1.5 
                            ${getComplaintStatusColor(complaint.status)}"
                          >
                            {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          {complaint.description}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <div className="text-xs font-semibold text-gray-500">
                            {safeFormatDate(complaint.createdAt)}
                          </div>

                          {complaint.status !== 'resolved' && (
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-full shadow-sm hover:bg-green-700 transition-all duration-300 flex items-center space-x-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Resolve</span>
                            </button>
                          )}

                          {complaint.status !== 'open' && (
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'open')}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-full shadow-sm hover:bg-red-700 transition-all duration-300 flex items-center space-x-1"
                            >
                              <X className="w-4 h-4" />
                              <span>Reopen</span>
                            </button>
                          )}

                          {canEditComplaintStatus(complaint) && complaint.status !== 'resolved' && (
                            <button
                              onClick={() => {
                                setEditingComplaint(complaint);
                                setShowNewComplaintForm(true);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-full shadow-sm hover:bg-blue-700 transition-all duration-300 flex items-center space-x-1"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => deleteComplaint(complaint.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-700 rounded-full shadow-sm hover:bg-red-800 transition-all duration-300 flex items-center space-x-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render timeline tab
  const renderTimelineTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">
        Project Timeline
      </h3>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timeline...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-2">Created Date</div>
              <div className="text-lg font-bold text-gray-900">
                {safeFormatDate(project.createdAt)}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-500 mb-2">Delivery Date</div>
              <div className="text-lg font-bold text-gray-900">
                {project.deliveryDate ? safeFormatDate(project.deliveryDate) : 'Not set'}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-gray-500 mb-2">Milestone Dates</div>
            <div className="space-y-2">
              {milestones.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No milestones yet. Milestones will appear here as they are created.
                </div>
              ) : (
                milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        milestone.status === 'completed' ? 'bg-green-500' :
                        milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {milestone.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {milestone.dueDate ? `Due: ${safeFormatDate(milestone.dueDate)}` : 'No due date'}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-semibold rounded-full px-3 py-1.5 
                      ${getMilestoneStatusColor(milestone.status)}"
                    >
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-500 mb-2">Project Duration</div>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-gray-900 ml-3">
                {project.daysInStage} days
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render modules tab
  const renderModulesTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">
        Project Modules
      </h3>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading modules...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className={`w-4 h-4 rounded-full ${
                project.status === 'completed' ? 'bg-green-500' :
                project.status === 'production' || project.status === 'installation' ? 'bg-blue-500' :
                project.status === 'dne' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="text-lg font-semibold text-gray-900 capitalize">
                {project.status === 'dne' ? 'Design & Engineering' : project.status}
              </span>
            </div>
            <p className="text-gray-600">Current project status</p>
          </div>
        </div>
      )}
    </div>
  );

  // Render complaints tab
  const renderComplaintsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <MessageSquare className="w-6 h-6 mr-2 text-red-500" />
          Project Complaints
        </h3>
        <button
          onClick={() => setShowNewComplaintForm(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Complaint</span>
        </button>
      </div>

      {complaintsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No complaints yet</h4>
          <p className="text-gray-600 mb-1">Complaints will appear here as they are reported</p>
          <p className="text-sm text-gray-500">Click "Add New Complaint" to report an issue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => (
            <div key={complaint.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    complaint.status === 'resolved' ? 'bg-green-500' :
                    complaint.status === 'in-progress' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {complaint.title}
                  </span>
                </div>
                <div className="text-xs font-semibold rounded-full px-3 py-1.5 
                  ${getComplaintStatusColor(complaint.status)}"
                >
                  {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                {complaint.description}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <div className="text-xs font-semibold text-gray-500">
                  {safeFormatDate(complaint.createdAt)}
                </div>

                {complaint.status !== 'resolved' && (
                  <button
                    onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-full shadow-sm hover:bg-green-700 transition-all duration-300 flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolve</span>
                  </button>
                )}

                {complaint.status !== 'open' && (
                  <button
                    onClick={() => updateComplaintStatus(complaint.id, 'open')}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-full shadow-sm hover:bg-red-700 transition-all duration-300 flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Reopen</span>
                  </button>
                )}

                {canEditComplaintStatus(complaint) && complaint.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      setEditingComplaint(complaint);
                      setShowNewComplaintForm(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-full shadow-sm hover:bg-blue-700 transition-all duration-300 flex items-center space-x-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => deleteComplaint(complaint.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-700 rounded-full shadow-sm hover:bg-red-800 transition-all duration-300 flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Project Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2
              ${activeTab === 'overview' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <Eye className="w-5 h-5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2
              ${activeTab === 'milestones' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <Target className="w-5 h-5" />
            <span>Milestones</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2
              ${activeTab === 'timeline' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <Clock className="w-5 h-5" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2
              ${activeTab === 'modules' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <Wrench className="w-5 h-5" />
            <span>Modules</span>
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2
              ${activeTab === 'complaints' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Complaints</span>
          </button>
        </div>

        {/* Active Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
          {activeTab === 'timeline' && renderTimelineTab()}
          {activeTab === 'modules' && renderModulesTab()}
          {activeTab === 'complaints' && renderComplaintsTab()}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
