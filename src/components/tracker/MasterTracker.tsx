import React, { useState, useEffect } from 'react';
import { BarChart3, Search, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import ModuleHeader from '../common/ModuleHeader';
import { useAuth } from '../../contexts/AuthContext';
import { projectsService, milestonesService, type Project, type Milestone } from '../../services/firebaseService';

interface ProjectWithMilestones extends Project {
  milestones?: Milestone[];
  daysInStage?: number;
  isOverdue?: boolean;
}

const MasterTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<ProjectWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'table'>('timeline');
  const [selectedProject, setSelectedProject] = useState<ProjectWithMilestones | null>(null);

  // Load all projects with milestones
  useEffect(() => {
    const loadProjectsData = async () => {
      try {
        setLoading(true);
        const allProjects = await projectsService.getProjects();

        // Enhance projects with milestone data and calculations
        const enhancedProjects = await Promise.all(
          allProjects.map(async (project) => {
            const milestones = await milestonesService.getMilestonesByProject(project.id!);

            // Calculate days in current stage
            const createdDate = new Date(project.createdAt.toDate());
            const today = new Date();
            const daysInStage = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

            // Check if overdue
            const completionDate = new Date(project.completionDate);
            const isOverdue = today > completionDate && project.status !== 'Completed';

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

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    const matchesDate = dateFilter === 'all' || (() => {
      const projectDate = new Date(project.completionDate);
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
          return project.status === 'DNE';
        case 'design':
          return project.status === 'DNE';
        case 'production':
          return project.status === 'Production';
        case 'installation':
          return project.status === 'Installation';
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate && matchesTeam;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DNE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Production':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Installation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (project: ProjectWithMilestones) => {
    switch (project.status) {
      case 'DNE':
        return 25;
      case 'Production':
        return 50;
      case 'Installation':
        return 75;
      case 'Completed':
        return 100;
      default:
        return 0;
    }
  };

  const getResponsibleTeam = (status: string) => {
    switch (status) {
      case 'DNE':
        return 'Design Team';
      case 'Production':
        return 'Production Team';
      case 'Installation':
        return 'Installation Team';
      case 'Completed':
        return 'Completed';
      default:
        return 'Sales Team';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
      <ModuleHeader
        title="Master Tracker"
        subtitle="Comprehensive overview of all projects and stages"
        icon={BarChart3}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-red-500 to-red-600"
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === 'timeline'
                ? 'bg-white text-red-600'
                : 'bg-red-400 text-white hover:bg-red-300'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === 'cards'
                ? 'bg-white text-red-600'
                : 'bg-red-400 text-white hover:bg-red-300'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-red-600'
                : 'bg-red-400 text-white hover:bg-red-300'
            }`}
          >
            Table
          </button>
        </div>
      </ModuleHeader>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {projects.filter(p => p.status !== 'Completed').length}
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
                  {projects.filter(p => p.status === 'Completed').length}
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
                  {projects.filter(p => p.isOverdue).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
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
              <option value="DNE">Design (DNE)</option>
              <option value="Production">Production</option>
              <option value="Installation">Installation</option>
              <option value="Completed">Completed</option>
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
                  <div className="space-y-4">
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
                              : project.status === 'Completed'
                              ? 'bg-green-500 border-green-500'
                              : 'bg-blue-500 border-blue-500'
                          }`}></div>

                          {/* Project Info */}
                          <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{project.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                  </span>
                                  {project.isOverdue && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                      Overdue
                                    </span>
                                  )}
                                </div>

                                {project.description && (
                                  <p className="text-gray-600 mb-3">{project.description}</p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                                    <p className="font-medium">{new Date(project.completionDate).toLocaleDateString()}</p>
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
                                        project.status === 'Completed'
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

                              <button
                                onClick={() => setSelectedProject(project)}
                                className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No projects found matching your filters</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{project.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
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
                              project.status === 'Completed'
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
                            {new Date(project.completionDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Days in Stage</span>
                          <span className="font-medium">{project.daysInStage} days</span>
                        </div>
                      </div>

                      {project.isOverdue && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Project is overdue
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedProject(project)}
                        className="w-full mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        View Details
                      </button>
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
                        {(currentUser?.role === 'admin' || currentUser?.role === 'sales') && (
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
                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                {project.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              {project.isOverdue && (
                                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      project.status === 'Completed'
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
                                {new Date(project.completionDate).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {project.daysInStage} days
                            </td>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'sales') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {project.amount ? `RM ${project.amount.toLocaleString()}` : '-'}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setSelectedProject(project)}
                                className="text-red-600 hover:text-red-900"
                              >
                                View
                              </button>
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

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedProject.name}</h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status}
                    </span>
                    {selectedProject.isOverdue && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                    <p className="text-gray-900">{selectedProject.description || 'No description provided'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Current Stage</h4>
                    <p className="text-gray-900">{getResponsibleTeam(selectedProject.status)}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Progress</h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            selectedProject.status === 'Completed'
                              ? 'bg-green-500'
                              : selectedProject.isOverdue
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${getProgressPercentage(selectedProject)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {getProgressPercentage(selectedProject)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Due Date</h4>
                    <p className={`text-gray-900 ${selectedProject.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      {new Date(selectedProject.completionDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Days in Current Stage</h4>
                    <p className="text-gray-900">{selectedProject.daysInStage} days</p>
                  </div>

                  {(currentUser?.role === 'admin' || currentUser?.role === 'sales') && selectedProject.amount && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Project Amount</h4>
                      <p className="text-gray-900 font-semibold">RM {selectedProject.amount.toLocaleString()}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Created Date</h4>
                    <p className="text-gray-900">{new Date(selectedProject.createdAt.toDate()).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-6 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterTracker;
