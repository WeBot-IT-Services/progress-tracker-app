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
  MapPin,
  Wrench,
  Hammer,
  Building,
  Users,
  TrendingUp,
  Target,
  Eye,
  MessageSquareX,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, complaintsService, type Project, type Milestone, type Complaint } from '../../services/firebaseService';
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
          
          // Load creator name
          if (project.createdBy) {
            try {
              // Try to get actual user name from Firebase
              // Fallback to formatting the email if no user data found
              const displayName = project.createdBy.includes('@') 
                ? project.createdBy.replace(/@.*$/, '').split(/[_.-]/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                : project.createdBy;
              
              setCreatedByName(displayName);
            } catch (userError) {
              console.log('Could not fetch user details, using identifier:', userError);
              setCreatedByName(project.createdBy);
            }
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
      
      console.log('✅ Complaint status updated successfully');
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
      
      console.log('✅ Complaint deleted successfully');
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
                  )}

                  {/* Enhanced Photos Section */}
                  {((milestone.files && milestone.files.length > 0) || (milestone.images && milestone.images.length > 0)) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Image className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Photos ({(milestone.files?.length || 0) + (milestone.images?.length || 0)})
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedMilestone(milestone)}
                          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-full hover:bg-blue-600 transition-colors flex items-center space-x-1 font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View All</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {/* Display images from both files and images arrays */}
                        {[...(milestone.files || []), ...(milestone.images?.map(img => typeof img === 'string' ? img : (img as any).url || img) || [])].slice(0, 8).map((file, fileIndex) => (
                          <div key={fileIndex} className="relative group">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                              {isImageFile(file) ? (
                                <img 
                                  src={typeof file === 'string' ? file : file.url} 
                                  alt={`Milestone ${milestone.title} - Photo ${fileIndex + 1}`}
                                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                  onClick={() => setSelectedMilestone(milestone)}
                                  onError={(e) => {
                                    console.error('Image load error:', typeof file === 'string' ? file : file.url);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            {[...(milestone.files || []), ...(milestone.images || [])].length > 8 && fileIndex === 7 && (
                              <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                +{[...(milestone.files || []), ...(milestone.images || [])].length - 8}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced empty state */}
                  {(!milestone.files || milestone.files.length === 0) && (!milestone.images || milestone.images.length === 0) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <Image className="w-5 h-5" />
                        <span className="text-sm">No photos uploaded yet</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">#{index + 1}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render timeline tab
  const renderTimelineTab = () => {
    const timelineEvents = [];

    // Add project creation
    timelineEvents.push({
      date: project.createdAt instanceof Date ? project.createdAt : new Date(project.createdAt || Date.now()),
      title: 'Project Created',
      description: 'Project was created in the system',
      type: 'creation',
      module: 'sales'
    });

    // Add module transitions
    if (project.designData?.assignedAt) {
      timelineEvents.push({
        date: new Date(project.designData.assignedAt),
        title: 'Moved to Design & Engineering',
        description: 'Project transitioned from Sales to Design phase',
        type: 'transition',
        module: 'design'
      });
    }

    if (project.designData?.completedAt) {
      timelineEvents.push({
        date: new Date(project.designData.completedAt),
        title: 'Design Completed',
        description: 'Design phase completed successfully',
        type: 'completion',
        module: 'design'
      });
    }

    if (project.productionData?.assignedAt) {
      timelineEvents.push({
        date: new Date(project.productionData.assignedAt),
        title: 'Moved to Production',
        description: 'Project transitioned to Production phase',
        type: 'transition',
        module: 'production'
      });
    }

    if (project.installationData?.assignedAt) {
      timelineEvents.push({
        date: new Date(project.installationData.assignedAt),
        title: 'Moved to Installation',
        description: 'Project transitioned to Installation phase',
        type: 'transition',
        module: 'installation'
      });
    }

    // Add milestone events
    milestones.forEach(milestone => {
      if (milestone.completedDate) {
        timelineEvents.push({
          date: new Date(milestone.completedDate),
          title: `Milestone: ${milestone.title}`,
          description: milestone.description || 'Milestone completed',
          type: 'milestone',
          module: project.status
        });
      }
    });

    // Sort by date
    timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    const getEventIcon = (type: string) => {
      switch (type) {
        case 'creation': return <Building className="w-5 h-5" />;
        case 'transition': return <MapPin className="w-5 h-5" />;
        case 'completion': return <CheckCircle className="w-5 h-5" />;
        case 'milestone': return <Target className="w-5 h-5" />;
        default: return <Clock className="w-5 h-5" />;
      }
    };

    const getEventColor = (type: string) => {
      switch (type) {
        case 'creation': return 'bg-blue-500 text-white border-blue-300';
        case 'transition': return 'bg-orange-500 text-white border-orange-300';
        case 'completion': return 'bg-green-500 text-white border-green-300';
        case 'milestone': return 'bg-purple-500 text-white border-purple-300';
        default: return 'bg-gray-500 text-white border-gray-300';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-red-500" />
              Project Timeline
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete project history and key milestones
            </p>
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {timelineEvents.length} events
          </div>
        </div>

        {timelineEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No timeline events</h4>
            <p className="text-gray-600">Timeline will populate as the project progresses</p>
          </div>
        ) : (
          <div className="relative">
            {/* Enhanced Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-orange-500 to-green-500"></div>

            <div className="space-y-8">
              {timelineEvents.map((event, index) => (
                <div key={index} className="relative flex items-start space-x-6">
                  {/* Enhanced Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${getEventColor(event.type)} shadow-lg`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Enhanced Event content */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">{event.title}</h4>
                        <p className="text-gray-600 mt-1 leading-relaxed">{event.description}</p>
                        
                        {/* Event metadata */}
                        <div className="flex items-center space-x-4 mt-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.type === 'creation' ? 'bg-blue-100 text-blue-700' :
                            event.type === 'transition' ? 'bg-orange-100 text-orange-700' :
                            event.type === 'completion' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {event.module.charAt(0).toUpperCase() + event.module.slice(1)} Module
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {safeFormatDate(event.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {Math.abs(Math.floor((new Date().getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24)))} days ago
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render modules tab
  const renderModulesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Users className="w-6 h-6 mr-2 text-red-500" />
          Module-Specific Information
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Detailed information from each project module
        </p>
      </div>

      {/* Sales Module Data */}
      {(isAdmin || canViewModuleData('sales')) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Sales Information</h4>
              <p className="text-sm text-gray-600">Project sales and delivery details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {canViewAmountField && project.amount && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Project Amount</div>
                <div className="text-lg font-bold text-green-900">RM {project.amount.toLocaleString()}</div>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Delivery Date</div>
              <div className="font-semibold text-gray-900">
                {safeFormatDate(project.deliveryDate)}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Sales Representative</div>
              <div className="font-semibold text-gray-900">{createdByName || 'Not assigned'}</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Priority Level</div>
              <div className={`font-semibold ${
                project.priority === 'high' ? 'text-red-600' :
                project.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  project.priority === 'high' ? 'bg-red-500' :
                  project.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1) || 'Normal'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Design Module Data */}
      {(isAdmin || canViewModuleData('design')) && project.designData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Design & Engineering</h4>
              <p className="text-sm text-gray-600">Technical design and engineering details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-700 mb-1">Design Status</div>
              <div className={`font-semibold ${
                project.designData.status === 'completed' ? 'text-green-600' :
                project.designData.status === 'partial' ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  project.designData.status === 'completed' ? 'bg-green-500' :
                  project.designData.status === 'partial' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                {project.designData.status?.charAt(0).toUpperCase() + project.designData.status?.slice(1)}
              </div>
            </div>

            {project.designData.assignedAt && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Assigned Date</div>
                <div className="font-semibold text-gray-900">
                  {safeFormatDate(project.designData.assignedAt)}
                </div>
              </div>
            )}

            {project.designData.completedAt && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Completion Date</div>
                <div className="font-semibold text-gray-900">
                  {safeFormatDate(project.designData.completedAt)}
                </div>
              </div>
            )}

            {project.designData.partialCompletedAt && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Partial Completion Date</div>
                <div className="font-semibold text-gray-900">
                  {safeFormatDate(project.designData.partialCompletedAt)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Production Module Data */}
      {(isAdmin || canViewModuleData('production')) && project.productionData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Production Information</h4>
              <p className="text-sm text-gray-600">Manufacturing and production details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.productionData.assignedAt && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-sm font-medium text-orange-700 mb-1">Production Start Date</div>
                <div className="font-semibold text-orange-900">
                  {safeFormatDate(project.productionData.assignedAt)}
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Production Milestones</div>
              <div className="font-semibold text-gray-900">
                {milestones.filter(m => m.projectId === project.id).length} milestone(s)
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Last Updated</div>
              <div className="font-semibold text-gray-900">
                {safeFormatDate(project.productionData.lastModified)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Installation Module Data */}
      {(isAdmin || canViewModuleData('installation')) && project.installationData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Hammer className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Installation Information</h4>
              <p className="text-sm text-gray-600">On-site installation and setup details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.installationData.assignedAt && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm font-medium text-purple-700 mb-1">Installation Start Date</div>
                <div className="font-semibold text-purple-900">
                  {safeFormatDate(project.installationData.assignedAt)}
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Installation Progress</div>
              <div className="font-semibold text-gray-900">
                {project.installationData.milestoneProgress ?
                  Object.keys(project.installationData.milestoneProgress).length : 0} milestone(s)
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Last Updated</div>
              <div className="font-semibold text-gray-900">
                {safeFormatDate(project.installationData.lastModified)}
              </div>
            </div>

            {project.files && project.files.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Installation Photos</div>
                <div className="font-semibold text-gray-900 flex items-center">
                  <Image className="w-4 h-4 mr-1" />
                  {project.files.length} photo(s)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Access Notice for Non-Admin Users */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Role-Based Access</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                You can only view information relevant to your department ({userRole}).
                Admin users have access to all module information across the entire project lifecycle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Module Status Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building className="w-5 h-5 mr-2 text-gray-600" />
          Module Status Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-green-700">Sales</div>
            <div className="text-xs text-green-600">Active</div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${
            project.designData ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <FileText className={`w-8 h-8 mx-auto mb-2 ${
              project.designData ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <div className={`text-sm font-medium ${
              project.designData ? 'text-blue-700' : 'text-gray-500'
            }`}>Design</div>
            <div className={`text-xs ${
              project.designData ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {project.designData ? project.designData.status?.charAt(0).toUpperCase() + project.designData.status?.slice(1) : 'Not Started'}
            </div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${
            project.productionData ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <Wrench className={`w-8 h-8 mx-auto mb-2 ${
              project.productionData ? 'text-orange-600' : 'text-gray-400'
            }`} />
            <div className={`text-sm font-medium ${
              project.productionData ? 'text-orange-700' : 'text-gray-500'
            }`}>Production</div>
            <div className={`text-xs ${
              project.productionData ? 'text-orange-600' : 'text-gray-400'
            }`}>
              {project.productionData ? 'Active' : 'Not Started'}
            </div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${
            project.installationData ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <Hammer className={`w-8 h-8 mx-auto mb-2 ${
              project.installationData ? 'text-purple-600' : 'text-gray-400'
            }`} />
            <div className={`text-sm font-medium ${
              project.installationData ? 'text-purple-700' : 'text-gray-500'
            }`}>Installation</div>
            <div className={`text-xs ${
              project.installationData ? 'text-purple-600' : 'text-gray-400'
            }`}>
              {project.installationData ? 'Active' : 'Not Started'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render complaints tab
  const renderComplaintsTab = () => {
    const ongoingComplaints = complaints.filter(c => c.status !== 'resolved');
    const completedComplaints = complaints.filter(c => c.status === 'resolved');
    const currentComplaints = complaintsSubTab === 'ongoing' ? ongoingComplaints : completedComplaints;

    return (
      <div className="space-y-6">
        {/* Header with Sub-tabs */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
            <MessageSquareX className="w-6 h-6 mr-2 text-red-500" />
            Project Complaints
          </h3>
          
          {/* Sub-tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setComplaintsSubTab('ongoing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                complaintsSubTab === 'ongoing'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              On-going ({ongoingComplaints.length})
            </button>
            <button
              onClick={() => setComplaintsSubTab('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                complaintsSubTab === 'completed'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({completedComplaints.length})
            </button>
          </div>
        </div>

        {/* Add New Complaint Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowNewComplaintForm(true)}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Complaint</span>
          </button>
        </div>

        {/* Complaints List */}
        {complaintsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading complaints...</p>
          </div>
        ) : currentComplaints.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <MessageSquareX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No {complaintsSubTab} complaints
            </h4>
            <p className="text-gray-600">
              {complaintsSubTab === 'ongoing' 
                ? 'All complaints for this project have been resolved'
                : 'No complaints have been resolved yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentComplaints.map((complaint) => (
              <div key={complaint.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Complaint Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{complaint.title}</h4>
                        <p className="text-gray-600 leading-relaxed">{complaint.description}</p>
                      </div>
                      
                      {/* Status and Priority Badges */}
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <div className="flex items-center space-x-2">
                          {canEditComplaintStatus(complaint) ? (
                            <select
                              value={complaint.status}
                              onChange={(e) => updateComplaintStatus(complaint.id, e.target.value as 'open' | 'in-progress' | 'resolved')}
                              className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getComplaintStatusColor(complaint.status)} focus:outline-none focus:ring-2 focus:ring-red-500`}
                              disabled={complaintsLoading}
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getComplaintStatusColor(complaint.status)}`}>
                              {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                            </span>
                          )}
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                          </span>
                        </div>
                        
                        {/* Delete Button for Admin */}
                        {isAdmin && (
                          <button
                            onClick={() => deleteComplaint(complaint.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            title="Delete complaint (Admin only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Complaint Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Customer: <span className="font-medium">{complaint.customerName}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Department: <span className="font-medium">{complaint.department}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Created: <span className="font-medium">{safeFormatDate(complaint.createdAt)}</span>
                        </span>
                      </div>
                      
                      {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Updated: <span className="font-medium">{safeFormatDate(complaint.updatedAt)}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Attached Images */}
                    {complaint.files && complaint.files.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Image className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Attached Images ({complaint.files.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {complaint.files.slice(0, 6).map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Complaint image ${index + 1}`}
                                className="w-full h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-red-300 transition-all"
                                onClick={() => window.open(imageUrl, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ))}
                          {complaint.files.length > 6 && (
                            <div className="flex items-center justify-center bg-gray-200 border border-gray-300 rounded-lg h-16 text-gray-600 text-xs font-medium">
                              +{complaint.files.length - 6} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to safely convert Timestamp or Date to Date
  const safeToDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (typeof dateValue?.toDate === 'function') {
      return dateValue.toDate();
    }
    if (dateValue instanceof Date) {
      return dateValue;
    }
    return new Date(dateValue);
  };

  const generateTimelineEvents = () => {
    const timelineEvents = [];

    // Add project creation
    timelineEvents.push({
      date: project.createdAt instanceof Date ? project.createdAt : new Date(project.createdAt || Date.now()),
      title: 'Project Created',
      description: 'Project was created in the system',
      type: 'creation',
      module: 'sales'
    });

    // Add module transitions
    if (project.designData?.assignedAt) {
      timelineEvents.push({
        date: new Date(project.designData.assignedAt),
        title: 'Moved to Design & Engineering',
        description: 'Project transitioned from Sales to Design phase',
        type: 'transition',
        module: 'design'
      });
    }

    if (project.designData?.completedAt) {
      timelineEvents.push({
        date: new Date(project.designData.completedAt),
        title: 'Design Completed',
        description: 'Design phase completed successfully',
        type: 'completion',
        module: 'design'
      });
    }

    if (project.productionData?.assignedAt) {
      timelineEvents.push({
        date: new Date(project.productionData.assignedAt),
        title: 'Moved to Production',
        description: 'Project transitioned to Production phase',
        type: 'transition',
        module: 'production'
      });
    }

    if (project.installationData?.assignedAt) {
      timelineEvents.push({
        date: new Date(project.installationData.assignedAt),
        title: 'Moved to Installation',
        description: 'Project transitioned to Installation phase',
        type: 'transition',
        module: 'installation'
      });
    }

    // Add milestone events
    milestones.forEach(milestone => {
      if (milestone.completedDate) {
        timelineEvents.push({
          date: new Date(milestone.completedDate),
          title: `Milestone: ${milestone.title}`,
          description: milestone.description || 'Milestone completed',
          type: 'milestone',
          module: project.status
        });
      }
    });

    // Sort by date
    timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    return timelineEvents;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Enhanced Header with Close Button */}
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white p-6 sm:p-8">
          {/* Close Button - Top Right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 z-10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <div className="flex items-start justify-between pr-16">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{project.projectName}</h2>
              <p className="text-red-100 mb-4 text-sm sm:text-base">
                {project.description || 'No description provided'}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 text-white`}>
                  {project.status && typeof project.status === 'string' 
                    ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
                    : 'Unknown Status'}
                </span>
                {project.isOverdue && (
                  <span className="px-3 py-1.5 bg-red-800/50 text-white rounded-full text-sm font-medium flex items-center space-x-1 backdrop-blur-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Overdue</span>
                  </span>
                )}
                <span className="text-sm text-red-100 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                  ID: {project.id}
                </span>
              </div>
            </div>
            
            {/* Progress Circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${getProgressPercentage()}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-white">
                    {getProgressPercentage()}%
                  </span>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-red-100 mt-1">Progress</span>
            </div>
          </div>
        </div>

        {/* Enhanced Modern Tab Navigation - Mobile Optimized */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-2 sm:px-6 py-2">
          <div className="flex justify-center">
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 w-full max-w-4xl">
              {[
                { id: 'overview', label: 'Overview', icon: Building, shortLabel: 'Info' },
                { id: 'milestones', label: 'Milestones', icon: Target, shortLabel: 'Goals' },
                { id: 'timeline', label: 'Timeline', icon: Clock, shortLabel: 'Time' },
                { id: 'modules', label: 'Module Data', icon: Users, shortLabel: 'Data' },
                { id: 'complaints', label: 'Complaints', icon: MessageSquareX, shortLabel: 'Issues' }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 px-2 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap flex-1 transform hover:scale-105 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-500'
                    }`} />
                    <span className="font-semibold text-xs sm:text-sm block sm:hidden">{tab.shortLabel}</span>
                    <span className="font-semibold hidden sm:block">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Tab Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
          <div className="p-4 sm:p-6">
            <div className="max-w-none">
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'milestones' && renderMilestonesTab()}
              {activeTab === 'timeline' && renderTimelineTab()}
              {activeTab === 'modules' && renderModulesTab()}
              {activeTab === 'complaints' && renderComplaintsTab()}
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 border-t border-gray-200 bg-white gap-3 sm:gap-0">
          <div className="text-sm text-gray-500 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date(project.updatedAt instanceof Date ? project.updatedAt : new Date()).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white py-2.5 px-6 rounded-xl transition-all duration-200 hover:scale-105 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Photo Viewer Modal */}
      {selectedMilestone && ((selectedMilestone.files && selectedMilestone.files.length > 0) || (selectedMilestone.images && selectedMilestone.images.length > 0)) && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedMilestone.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {(selectedMilestone.files?.length || 0) + (selectedMilestone.images?.length || 0)} photo{((selectedMilestone.files?.length || 0) + (selectedMilestone.images?.length || 0)) !== 1 ? 's' : ''} • View milestone documentation
                </p>
              </div>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...(selectedMilestone.files || []), ...(selectedMilestone.images || [])].map((file, fileIndex) => {
                  // Handle both string URLs and objects with URL property
                  const imageUrl = typeof file === 'string' ? file : (file as any).url;
                  const imageData = typeof file === 'object' ? (file as any) : {};
                  
                  return (
                    <div key={fileIndex} className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
                        {isImageFile(file) ? (
                          <img 
                            src={imageUrl} 
                            alt={`${selectedMilestone.title} - Photo ${fileIndex + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => window.open(imageUrl, '_blank')}
                            onError={(e) => {
                              console.error('Image load error:', imageUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                            <FileText className="w-12 h-12 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 font-medium">Document</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced Photo Details */}
                      <div className="p-4 space-y-2">
                        {imageData?.caption && (
                          <p className="text-sm text-gray-700 font-medium">{imageData.caption}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Photo {fileIndex + 1}
                          </span>
                          {imageData?.uploadedAt && (
                            <span className="text-xs text-gray-500">
                              {safeFormatDate(imageData.uploadedAt)}
                            </span>
                          )}
                        </div>
                        {imageData?.uploadedBy && (
                          <div className="flex items-center space-x-2">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{imageData.uploadedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {[...(selectedMilestone.files || []), ...(selectedMilestone.images || [])].length === 0 && (
                <div className="text-center py-16">
                  <Image className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No photos available</h4>
                  <p className="text-gray-600 mb-1">Photos will appear here when uploaded</p>
                  <p className="text-sm text-gray-500">Document your project progress with photos</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{(selectedMilestone.files?.length || 0) + (selectedMilestone.images?.length || 0)}</span> photo{((selectedMilestone.files?.length || 0) + (selectedMilestone.images?.length || 0)) !== 1 ? 's' : ''} total
                </div>
                {((selectedMilestone.files?.length || 0) + (selectedMilestone.images?.length || 0)) > 0 && (
                  <div className="text-xs text-gray-500">
                    Click any photo to view full size
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="bg-red-500 hover:bg-red-600 text-white py-2.5 px-6 rounded-xl transition-all duration-200 hover:scale-105 font-medium"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsModal;
