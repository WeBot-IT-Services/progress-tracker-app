import React, { useState, useEffect } from 'react';
import { BarChart3, Search, Clock, CheckCircle, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import SimpleProjectDetailsModal from './SimpleProjectDetailsModal';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, type Project } from '../../services/firebaseService';
import { canViewAmount, canDeleteProject } from '../../utils/permissions';
import { safeFormatDate, safeToDate, isValidDate } from '../../utils/dateUtils';

interface ProjectWithMilestones extends Project {
  daysInStage?: number;
  isOverdue?: boolean;
}

const MasterTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<ProjectWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'timeline' | 'cards' | 'table'>('overview');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Prevent rapid clicks
  const handleClick = (callback: () => void, minDelay: number = 300) => {
    const now = Date.now();
    if (now - lastClickTime > minDelay) {
      setLastClickTime(now);
      callback();
    }
  };

  // Get user permissions for amount visibility and deletion
  const canViewAmountField = canViewAmount(currentUser?.role || 'sales');
  const canDeleteProjects = canDeleteProject(currentUser?.role || 'sales');

  // Load all projects with milestones
  useEffect(() => {
    const loadProjectsData = async () => {
      try {
        setLoading(true);
        const allProjects = await projectsService.getProjects();

        // Enhance projects with milestone data and calculations
        const enhancedProjects = await Promise.all(
          allProjects.map(async (project) => {
            const milestones = await projectsService.getMilestonesByProject(project.id!);

            // Calculate days in current stage - use safe date conversion
            const createdDate = safeToDate(project.createdAt);
            const today = new Date();
            const daysInStage = createdDate 
              ? Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            // Check if overdue - handle invalid delivery dates safely
            let isOverdue = false;
            if (project.deliveryDate) {
              const deliveryDate = safeToDate(project.deliveryDate);
              isOverdue = deliveryDate ? (today > deliveryDate && project.status !== 'completed') : false;
            }

            return {
              ...project,
              milestones,
              daysInStage,
              isOverdue
            } as ProjectWithMilestones;
          })
        );

        setProjects(enhancedProjects);
      } catch (error) {
        console.error('Error loading projects data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjectsData();
  }, []);

  // Handle project deletion - only for admin users
  const handleDeleteProject = async (projectId: string) => {
    // Prevent multiple clicks
    if (deletingProject) return;
    
    // Double-check permissions - only admin users can delete projects
    if (!canDeleteProjects || currentUser?.role !== 'admin') {
      alert('You do not have permission to delete projects. Only admin users can delete projects.');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    const projectName = project?.projectName || 'Unknown Project';

    // Enhanced confirmation dialog
    const confirmMessage = `DELETE PROJECT CONFIRMATION

Project: ${projectName}
ID: ${projectId}

This action will permanently delete:
• The project and all its data
• All associated milestones and images
• All production and installation records
• Any document locks and collaborative sessions
• Related complaints and notifications

This action CANNOT be undone.

Are you absolutely sure you want to delete this project?`;

    if (!confirm(confirmMessage)) return;

    try {
      setDeletingProject(projectId);
      console.log('🗑️ Starting comprehensive project deletion for:', projectName);
      await projectsService.deleteProject(projectId);

      // Reload projects to reflect changes
      const updatedProjects = await projectsService.getProjects();

      // Enhance projects with milestone data and calculations
      const enhancedProjects = await Promise.all(
        updatedProjects.map(async (project) => {
          const milestones = await projectsService.getMilestonesByProject(project.id!);

          // Calculate days in current stage - use safe date conversion
          const createdDate = safeToDate(project.createdAt);
          const today = new Date();
          const daysInStage = createdDate 
            ? Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          // Check if overdue - handle invalid delivery dates safely
          let isOverdue = false;
          if (project.deliveryDate) {
            const deliveryDate = safeToDate(project.deliveryDate);
            isOverdue = deliveryDate ? (today > deliveryDate && project.status !== 'completed') : false;
          }

          return {
            ...project,
            milestones,
            daysInStage,
            isOverdue
          } as ProjectWithMilestones;
        })
      );

      setProjects(enhancedProjects);

      alert(`Project "${projectName}" has been successfully deleted along with all associated data.`);
      console.log('Project deletion completed successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project "${projectName}". Please try again.\n\nError: ${error.message}`);
    } finally {
      setDeletingProject(null);
    }
  };

  // All users can see all projects - no role-based filtering
  // Role-based information visibility is handled within the display components
  const roleFilteredProjects = projects;

  // Filter projects based on search and filters
  const filteredProjects = roleFilteredProjects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    const matchesDate = dateFilter === 'all' || (() => {
      if (!project.deliveryDate) return false;
      
      const projectDate = safeToDate(project.deliveryDate);
      if (!projectDate) return false;
      
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'overdue':
          return project.isOverdue;
        case 'due-soon':
          return projectDate <= thirtyDaysFromNow && projectDate > today;
        case 'this-month':
          return projectDate.getMonth() === today.getMonth() && projectDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    })();

    const matchesTeam = teamFilter === 'all' || (() => {
      switch (teamFilter) {
        case 'sales':
          return project.status === 'sales';
        case 'design':
          return project.status === 'dne';
        case 'production':
          return project.status === 'production';
        case 'installation':
          return project.status === 'installation';
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate && matchesTeam;
  });

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

  const getProgressPercentage = (project: ProjectWithMilestones) => {
    if (!project.status) return 0;

    switch (project.status.toLowerCase()) {
      case 'sales':
        return 10;
      case 'dne':
        return 25;
      case 'production':
        return 50;
      case 'installation':
        return 75;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  const getResponsibleTeam = (status: string) => {
    if (!status) return 'Sales Team';

    switch (status.toLowerCase()) {
      case 'sales':
        return 'Sales Team';
      case 'dne':
        return 'Design Team';
      case 'production':
        return 'Production Team';
      case 'installation':
        return 'Installation Team';
      case 'completed':
        return 'Completed';
      default:
        return 'Sales Team';
    }
  };

  const getStatusDisplayName = (status: string) => {
    if (!status) return 'Unknown';

    switch (status.toLowerCase()) {
      case 'sales':
        return 'Sales';
      case 'dne':
        return 'Design & Engineering';
      case 'production':
        return 'Production';
      case 'installation':
        return 'Installation';
      case 'completed':
        return 'Completed';
      default:
        return status && typeof status === 'string' 
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : 'Unknown Status';
    }
  };

  return (
    <>
      <ModuleContainer
        title="Master Tracker"
        subtitle=""
        icon={BarChart3}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-red-500 to-red-600"
        className="bg-gradient-to-br from-red-50 via-white to-rose-50"
        maxWidth="7xl"
        fullViewport={true}
        headerActions={
          <div className="flex items-center space-x-3">
            {/* Read-only indicator */}
            <div className="flex items-center bg-red-400 text-white px-3 py-1 rounded-lg text-sm">
              <Eye className="w-4 h-4 mr-1" />
              View Only
            </div>
          </div>
        }
    >
      {/* Content - Positioned properly by ModuleContainer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* Statistics Overview - All projects visible to all users */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{roleFilteredProjects.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {roleFilteredProjects.filter(p => p.status !== 'completed').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {roleFilteredProjects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {roleFilteredProjects.filter(p => p.isOverdue).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* View Mode Navigation - Second Layer */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 mb-6">
          <div className="flex items-center justify-between">
            {/* <h3 className="text-lg font-semibold text-gray-900">View Mode</h3> */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleClick(() => setViewMode('overview'))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleClick(() => setViewMode('timeline'))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => handleClick(() => setViewMode('cards'))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => handleClick(() => setViewMode('table'))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="sales">Sales</option>
              <option value="dne">Design (DNE)</option>
              <option value="production">Production</option>
              <option value="installation">Installation</option>
              <option value="completed">Completed</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="due-soon">Due Soon</option>
              <option value="this-month">This Month</option>
            </select>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Teams</option>
              <option value="sales">Sales Team</option>
              <option value="design">Design Team</option>
              <option value="production">Production Team</option>
              <option value="installation">Installation Team</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
                setTeamFilter('all');
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project data...</p>
          </div>
        ) : (
          <>
            {/* Overview */}
            {viewMode === 'overview' && (
              <div className="space-y-6">
                {/* Module Delivery Times - All modules visible to all users */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Module Delivery Times (All Teams)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Sales Module - Visible to all users */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-green-800">Sales</h4>
                        <span className="text-2xl font-bold text-green-600">
                          {roleFilteredProjects.filter(p => p.status === 'sales').length}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">Avg. Time:</span>
                          <span className="font-medium">7-14 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Current Projects:</span>
                          <span className="font-medium">{roleFilteredProjects.filter(p => p.status === 'sales').length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Design Module - Visible to all users */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-800">Design & Engineering</h4>
                        <span className="text-2xl font-bold text-blue-600">
                          {roleFilteredProjects.filter(p => p.status === 'dne').length}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Avg. Time:</span>
                          <span className="font-medium">14-21 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Current Projects:</span>
                          <span className="font-medium">{roleFilteredProjects.filter(p => p.status === 'dne').length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Production Module - Visible to all users */}
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-orange-800">Production</h4>
                        <span className="text-2xl font-bold text-orange-600">
                          {roleFilteredProjects.filter(p => p.status === 'production').length}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-orange-700">Avg. Time:</span>
                          <span className="font-medium">21-35 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-700">Current Projects:</span>
                          <span className="font-medium">{roleFilteredProjects.filter(p => p.status === 'production').length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Installation Module - Visible to all users */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-purple-800">Installation</h4>
                        <span className="text-2xl font-bold text-purple-600">
                          {roleFilteredProjects.filter(p => p.status === 'installation').length}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Avg. Time:</span>
                          <span className="font-medium">7-14 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Current Projects:</span>
                          <span className="font-medium">{roleFilteredProjects.filter(p => p.status === 'installation').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Delivery Timeline Overview */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Delivery Timeline Overview</h3>

                  <div className="space-y-4">
                    {filteredProjects.map((project) => {
                      const getModuleDeliveryInfo = (project: ProjectWithMilestones) => {
                        const createdDate = safeToDate(project.createdAt);
                        const deliveryDate = safeToDate(project.deliveryDate);

                        return {
                          projectStart: createdDate ? safeFormatDate(createdDate, 'Not set') : 'Not set',
                          salesCompleted: project.salesData?.completedAt
                            ? safeFormatDate(safeToDate(project.salesData.completedAt), 'Not completed')
                            : (project.status === 'sales'
                                ? 'In Progress'
                                : (['dne', 'production', 'installation', 'completed'].includes(project.status))
                                  ? (createdDate ? safeFormatDate(createdDate, 'Not set') : 'Not set')
                                  : 'Not Started'),
                          designCompleted: project.designData?.completedAt
                            ? safeFormatDate(safeToDate(project.designData.completedAt), 'Not completed')
                            : project.designData?.partialCompletedAt
                              ? safeFormatDate(safeToDate(project.designData.partialCompletedAt), 'Not completed')
                              : (project.status === 'dne' 
                                  ? 'In Progress' 
                                  : (['production', 'installation', 'completed'].includes(project.status))
                                    ? (project.designData?.lastModified 
                                        ? safeFormatDate(safeToDate(project.designData.lastModified), 'Completed') 
                                        : 'Completed')
                                    : 'Not Started'),
                          productionCompleted: project.productionData?.completedAt
                            ? safeFormatDate(safeToDate(project.productionData.completedAt), 'Not completed')
                            : (project.status === 'production' 
                                ? 'In Progress' 
                                : (['installation', 'completed'].includes(project.status))
                                  ? 'Completed'
                                  : 'Not Started'),
                          installationCompleted: project.installationData?.completedAt
                            ? safeFormatDate(safeToDate(project.installationData.completedAt), 'Not completed')
                            : (project.status === 'installation' 
                                ? 'In Progress' 
                                : (project.status === 'completed')
                                  ? 'Completed'
                                  : 'Not Started'),
                          expectedCompletion: deliveryDate ? safeFormatDate(deliveryDate, 'Not set') : 'Not set',
                          currentStatus: project.status
                        };
                      };

                      const deliveryInfo = getModuleDeliveryInfo(project);

                      return (
                        <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900">{project.projectName}</h4>
                              <p className="text-sm text-gray-600">
                                Started: {deliveryInfo.projectStart} • Expected Completion: {deliveryInfo.expectedCompletion}
                                {project.isOverdue && <span className="text-red-600 ml-2">• Overdue</span>}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
                              {getStatusDisplayName(project.status)}
                            </span>
                          </div>

                          {/* Module Delivery Dates Table - Role-based View */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Module</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Delivery Date</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Sales - Visible to all users */}
                                <tr className="border-b border-gray-100">
                                  <td className="py-2 px-3 text-green-700 font-medium">Sales</td>
                                  <td className="py-2 px-3">{deliveryInfo.salesCompleted}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      deliveryInfo.salesCompleted !== 'In Progress' && deliveryInfo.salesCompleted !== 'Not Started'
                                        ? 'bg-green-100 text-green-800'
                                        : deliveryInfo.salesCompleted === 'In Progress'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {deliveryInfo.salesCompleted !== 'In Progress' && deliveryInfo.salesCompleted !== 'Not Started'
                                        ? 'Completed'
                                        : deliveryInfo.salesCompleted}
                                    </span>
                                  </td>
                                </tr>

                                {/* Design - Visible to all users */}
                                <tr className="border-b border-gray-100">
                                  <td className="py-2 px-3 text-blue-700 font-medium">Design & Engineering</td>
                                  <td className="py-2 px-3">{deliveryInfo.designCompleted}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      deliveryInfo.designCompleted !== 'In Progress' && deliveryInfo.designCompleted !== 'Not Started'
                                        ? 'bg-green-100 text-green-800'
                                        : deliveryInfo.designCompleted === 'In Progress'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {deliveryInfo.designCompleted !== 'In Progress' && deliveryInfo.designCompleted !== 'Not Started'
                                        ? 'Completed'
                                        : deliveryInfo.designCompleted}
                                    </span>
                                  </td>
                                </tr>

                                {/* Production - Visible to all users */}
                                <tr className="border-b border-gray-100">
                                  <td className="py-2 px-3 text-orange-700 font-medium">Production</td>
                                  <td className="py-2 px-3">{deliveryInfo.productionCompleted}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      deliveryInfo.productionCompleted !== 'In Progress' && deliveryInfo.productionCompleted !== 'Not Started'
                                        ? 'bg-green-100 text-green-800'
                                        : deliveryInfo.productionCompleted === 'In Progress'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {deliveryInfo.productionCompleted !== 'In Progress' && deliveryInfo.productionCompleted !== 'Not Started'
                                        ? 'Completed'
                                        : deliveryInfo.productionCompleted}
                                    </span>
                                  </td>
                                </tr>

                                {/* Installation - Visible to all users */}
                                <tr>
                                  <td className="py-2 px-3 text-purple-700 font-medium">Installation</td>
                                  <td className="py-2 px-3">{deliveryInfo.installationCompleted}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      deliveryInfo.installationCompleted !== 'In Progress' && deliveryInfo.installationCompleted !== 'Not Started'
                                        ? 'bg-green-100 text-green-800'
                                        : deliveryInfo.installationCompleted === 'In Progress'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {deliveryInfo.installationCompleted !== 'In Progress' && deliveryInfo.installationCompleted !== 'Not Started'
                                        ? 'Completed'
                                        : deliveryInfo.installationCompleted}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Project Flow Summary */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Flow Summary</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Flow Diagram */}
                    {/* <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Standard Project Flow</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full whitespace-nowrap">Sales</div>
                        <span className="text-gray-400">→</span>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap">Design</div>
                        <span className="text-gray-400">→</span>
                        <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full whitespace-nowrap">Production</div>
                        <span className="text-gray-400">→</span>
                        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full whitespace-nowrap">Installation</div>
                        <span className="text-gray-400">→</span>
                        <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full whitespace-nowrap">Completed</div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Total estimated delivery time: <span className="font-medium">49-84 days</span>
                      </p>
                    </div> */}

                    {/* Recent Activity - All projects visible */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Recent Activity (All Projects)</h4>
                      <div className="space-y-2">
                        {roleFilteredProjects.slice(0, 5).map((project) => (
                          <div key={project.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{project.projectName}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                              {getStatusDisplayName(project.status)}
                            </span>
                          </div>
                        ))}
                        {roleFilteredProjects.length === 0 && (
                          <p className="text-gray-500 text-sm">No recent activity</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Timeline</h3>

                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No projects found matching your filters</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gray-200"></div>

                        {/* Project Card */}
                        <div className="flex items-start space-x-4">
                          {/* Timeline Dot */}
                          <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
                            project.isOverdue
                              ? 'bg-red-500 border-red-500'
                              : project.status === 'completed'
                              ? 'bg-green-500 border-green-500'
                              : 'bg-blue-500 border-blue-500'
                          }`}></div>

                          {/* Project Info */}
                          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center flex-wrap gap-3 mb-3">
                                  <h4 className="text-lg font-semibold text-gray-900">{project.projectName}</h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(project.status)}`}>
                                    {getStatusDisplayName(project.status)}
                                  </span>
                                  {project.isOverdue && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium whitespace-nowrap">
                                      Overdue
                                    </span>
                                  )}
                                </div>

                                {project.description && (
                                  <p className="text-gray-600 mb-3">{project.description}</p>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500">Current Stage</p>
                                    <p className="font-medium">{getResponsibleTeam(project.status)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Progress</p>
                                    <p className="font-medium">{getProgressPercentage(project)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Due Date</p>
                                    <p className="font-medium">
                                      {project.deliveryDate ? safeFormatDate(project.deliveryDate, 'Not set') : 'Not set'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Days in Stage</p>
                                    <p className="font-medium">{project.daysInStage} days</p>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                    <span>Overall Progress</span>
                                    <span>{getProgressPercentage(project)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        project.status === 'completed'
                                          ? 'bg-green-500'
                                          : project.isOverdue
                                          ? 'bg-red-500'
                                          : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${getProgressPercentage(project)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              <div className="ml-4 flex items-center space-x-2">
                                <button
                                  onClick={() => handleClick(() => setSelectedProject(project))}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View project details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {canDeleteProjects && (
                                  <button
                                    onClick={() => handleDeleteProject(project.id!)}
                                    disabled={deletingProject === project.id}
                                    className={`p-2 rounded-lg transition-colors ${
                                      deletingProject === project.id
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                    title={deletingProject === project.id ? 'Deleting...' : 'Delete project'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No projects found matching your filters</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 min-h-[320px] flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex-1 pr-3 leading-tight">{project.projectName}</h4>
                        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(project.status)}`}>
                            {getStatusDisplayName(project.status)}
                          </span>
                          {project.isOverdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium whitespace-nowrap">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                      )}

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium">{getProgressPercentage(project)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              project.status === 'completed'
                                ? 'bg-green-500'
                                : project.isOverdue
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${getProgressPercentage(project)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Team</span>
                          <span className="font-medium">{getResponsibleTeam(project.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Due Date</span>
                          <span className={`font-medium ${project.isOverdue ? 'text-red-600' : ''}`}>
                            {project.deliveryDate ? safeFormatDate(project.deliveryDate, 'Not set') : 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Days in Stage</span>
                          <span className="font-medium">{project.daysInStage} days</span>
                        </div>
                      </div>

                      {project.isOverdue && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Project is overdue
                          </div>
                        </div>
                      )}

                      <div className="mt-auto pt-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleClick(() => setSelectedProject(project))}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-lg transition-all duration-200 font-medium"
                          >
                            View Details
                          </button>
                          {canDeleteProjects && (
                            <button
                              onClick={() => handleDeleteProject(project.id!)}
                              disabled={deletingProject === project.id}
                              className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                                deletingProject === project.id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                              }`}
                              title={deletingProject === project.id ? 'Deleting...' : 'Delete project'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days in Stage
                        </th>
                        {canViewAmountField && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                            No projects found matching your filters
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((project) => (
                          <tr key={project.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{project.projectName}</div>
                                {project.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border w-fit ${getStatusColor(project.status)}`}>
                                  {getStatusDisplayName(project.status)}
                                </span>
                                {project.isOverdue && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 w-fit">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      project.status === 'completed'
                                        ? 'bg-green-500'
                                        : project.isOverdue
                                        ? 'bg-red-500'
                                        : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${getProgressPercentage(project)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-900">{getProgressPercentage(project)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getResponsibleTeam(project.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={project.isOverdue ? 'text-red-600 font-medium' : ''}>
                                {project.deliveryDate ? safeFormatDate(project.deliveryDate, 'Not set') : 'Not set'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {project.daysInStage} days
                            </td>
                            {canViewAmountField && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {project.amount ? `RM ${project.amount.toLocaleString()}` : '-'}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleClick(() => setSelectedProject(project))}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  View
                                </button>
                                {canDeleteProjects && (
                                  <button
                                    onClick={() => handleDeleteProject(project.id!)}
                                    disabled={deletingProject === project.id}
                                    className={deletingProject === project.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}
                                    title={deletingProject === project.id ? 'Deleting...' : 'Delete project'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </ModuleContainer>

      {/* Simple Project Detail Modal */}
      {selectedProject && (
        <SimpleProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
};

export default MasterTracker;
