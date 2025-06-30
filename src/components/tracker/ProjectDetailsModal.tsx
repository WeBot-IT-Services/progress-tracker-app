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
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, type Project, type Milestone } from '../../services/firebaseService';
import { canViewAmount, getModulePermissions } from '../../utils/permissions';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'timeline' | 'modules'>('overview');

  const userRole = currentUser?.role || 'sales';
  const canViewAmountField = canViewAmount(userRole);
  const isAdmin = userRole === 'admin';

  // Load milestones
  useEffect(() => {
    const loadMilestones = async () => {
      if (project.id) {
        try {
          setLoading(true);
          const projectMilestones = await projectsService.getMilestonesByProject(project.id);
          setMilestones(projectMilestones);
        } catch (error) {
          console.error('Error loading milestones:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMilestones();
  }, [project.id]);

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

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
            <p className="text-gray-600 mb-4">{project.description || 'No description provided'}</p>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getModuleIcon(project.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
              
              {project.isOverdue && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Overdue</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Progress</div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    project.status === 'completed'
                      ? 'bg-green-500'
                      : project.isOverdue
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {getProgressPercentage()}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Delivery Date</div>
              <div className={`font-medium ${project.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(project.deliveryDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-sm text-gray-500">Days in Stage</div>
              <div className="font-medium text-gray-900">{project.daysInStage} days</div>
            </div>
          </div>
        </div>

        {canViewAmountField && project.amount && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-500">Project Amount</div>
                <div className="font-medium text-gray-900">RM {project.amount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Created By</div>
              <div className="font-medium text-gray-900">{project.createdBy || 'Unknown'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <div>
              <div className="text-sm text-gray-500">Priority</div>
              <div className={`font-medium ${
                project.priority === 'high' ? 'text-red-600' :
                project.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1) || 'Normal'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Created Date</div>
              <div className="font-medium text-gray-900">
                {new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{milestones.length}</div>
            <div className="text-sm text-gray-500">Total Milestones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {milestones.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {milestones.filter(m => m.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {milestones.filter(m => m.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render milestones tab
  const renderMilestonesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Project Milestones</h4>
        <div className="text-sm text-gray-500">
          {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading milestones...</p>
        </div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No milestones found for this project</p>
          <p className="text-sm text-gray-500 mt-1">Milestones will appear here as they are created</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="text-lg font-medium text-gray-900">{milestone.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMilestoneStatusColor(milestone.status)}`}>
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                  </div>

                  {milestone.description && (
                    <p className="text-gray-600 mb-3">{milestone.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {milestone.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {milestone.completedDate && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          Completed: {new Date(milestone.completedDate).toLocaleDateString()}
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
                        Created: {new Date(milestone.createdAt?.toDate ? milestone.createdAt.toDate() : milestone.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar for milestone */}
                  {milestone.progress !== undefined && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            milestone.status === 'completed' ? 'bg-green-500' :
                            milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${milestone.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Milestone files/images */}
                  {milestone.files && milestone.files.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600 mb-2">Attachments ({milestone.files.length})</div>
                      <div className="flex flex-wrap gap-2">
                        {milestone.files.slice(0, 3).map((file, fileIndex) => (
                          <div key={fileIndex} className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1">
                            <Image className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">File {fileIndex + 1}</span>
                          </div>
                        ))}
                        {milestone.files.length > 3 && (
                          <div className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1">
                            <span className="text-xs text-gray-600">+{milestone.files.length - 3} more</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4 text-right">
                  <div className="text-sm text-gray-500">#{index + 1}</div>
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
      date: project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt),
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
        case 'creation': return <Building className="w-4 h-4" />;
        case 'transition': return <MapPin className="w-4 h-4" />;
        case 'completion': return <CheckCircle className="w-4 h-4" />;
        case 'milestone': return <Target className="w-4 h-4" />;
        default: return <Clock className="w-4 h-4" />;
      }
    };

    const getEventColor = (type: string) => {
      switch (type) {
        case 'creation': return 'bg-blue-500 text-white';
        case 'transition': return 'bg-orange-500 text-white';
        case 'completion': return 'bg-green-500 text-white';
        case 'milestone': return 'bg-purple-500 text-white';
        default: return 'bg-gray-500 text-white';
      }
    };

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Project Timeline</h4>

        {timelineEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No timeline events found</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={index} className="relative flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {event.date.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      <h4 className="text-lg font-semibold text-gray-900">Module-Specific Information</h4>

      {/* Sales Module Data */}
      {(isAdmin || canViewModuleData('sales')) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h5 className="text-lg font-semibold text-gray-900">Sales Information</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canViewAmountField && project.amount && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Project Amount</div>
                <div className="font-medium text-gray-900">RM {project.amount.toLocaleString()}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 mb-1">Delivery Date</div>
              <div className="font-medium text-gray-900">
                {new Date(project.deliveryDate).toLocaleDateString()}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Sales Representative</div>
              <div className="font-medium text-gray-900">{project.createdBy || 'Not assigned'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Priority Level</div>
              <div className={`font-medium ${
                project.priority === 'high' ? 'text-red-600' :
                project.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1) || 'Normal'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Design Module Data */}
      {(isAdmin || canViewModuleData('design')) && project.designData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-blue-500" />
            <h5 className="text-lg font-semibold text-gray-900">Design & Engineering</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Design Status</div>
              <div className={`font-medium ${
                project.designData.status === 'completed' ? 'text-green-600' :
                project.designData.status === 'partial' ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {project.designData.status?.charAt(0).toUpperCase() + project.designData.status?.slice(1)}
              </div>
            </div>

            {project.designData.assignedAt && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Assigned Date</div>
                <div className="font-medium text-gray-900">
                  {new Date(project.designData.assignedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {project.designData.completedAt && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Completion Date</div>
                <div className="font-medium text-gray-900">
                  {new Date(project.designData.completedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {project.designData.partialCompletedAt && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Partial Completion Date</div>
                <div className="font-medium text-gray-900">
                  {new Date(project.designData.partialCompletedAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Production Module Data */}
      {(isAdmin || canViewModuleData('production')) && project.productionData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Wrench className="w-6 h-6 text-orange-500" />
            <h5 className="text-lg font-semibold text-gray-900">Production Information</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.productionData.assignedAt && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Production Start Date</div>
                <div className="font-medium text-gray-900">
                  {new Date(project.productionData.assignedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 mb-1">Production Milestones</div>
              <div className="font-medium text-gray-900">
                {milestones.filter(m => m.projectId === project.id).length} milestone(s)
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Last Updated</div>
              <div className="font-medium text-gray-900">
                {new Date(project.productionData.lastModified).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Installation Module Data */}
      {(isAdmin || canViewModuleData('installation')) && project.installationData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Hammer className="w-6 h-6 text-purple-500" />
            <h5 className="text-lg font-semibold text-gray-900">Installation Information</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.installationData.assignedAt && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Installation Start Date</div>
                <div className="font-medium text-gray-900">
                  {new Date(project.installationData.assignedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 mb-1">Installation Progress</div>
              <div className="font-medium text-gray-900">
                {project.installationData.milestoneProgress ?
                  Object.keys(project.installationData.milestoneProgress).length : 0} milestone(s)
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Last Updated</div>
              <div className="font-medium text-gray-900">
                {new Date(project.installationData.lastModified).toLocaleDateString()}
              </div>
            </div>

            {project.files && project.files.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Installation Photos</div>
                <div className="font-medium text-gray-900">{project.files.length} photo(s)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Access Notice for Non-Admin Users */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <div className="text-sm text-blue-700">
              <strong>Role-Based Access:</strong> You can only view information relevant to your department ({userRole}).
              Admin users have access to all module information.
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">{project.name}</h2>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              {project.isOverdue && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Overdue</span>
                </span>
              )}
              <span className="text-sm text-gray-500">
                ID: {project.id}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Building },
            { id: 'milestones', label: 'Milestones', icon: Target },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'modules', label: 'Module Data', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
          {activeTab === 'timeline' && renderTimelineTab()}
          {activeTab === 'modules' && renderModulesTab()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(project.updatedAt?.toDate ? project.updatedAt.toDate() : project.updatedAt).toLocaleString()}
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-6 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
