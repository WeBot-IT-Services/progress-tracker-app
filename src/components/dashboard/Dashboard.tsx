import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NetworkStatus from '../common/NetworkStatus';
import SyncStatusDashboard from '../common/SyncStatusDashboard';
import MysteelLogo from '../common/MysteelLogo';
import VersionDisplay from '../common/VersionDisplay';
import { statisticsService } from '../../services/firebaseService';
// import { testingMode } from '../../utils/testingMode';
import {
  DollarSign,
  Wrench,
  Factory,
  Hammer,
  BarChart3,
  MessageSquare,
  LogOut,
  User,
  Settings,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    inProduction: 0,
    openComplaints: 0,
    totalProjects: 0,
    totalComplaints: 0
  });
  const [loading, setLoading] = useState(true);
  const [showSyncDashboard, setShowSyncDashboard] = useState(false);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(true);

  // Load statistics from Firebase
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const dashboardStats = await statisticsService.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading statistics:', error);

        // Handle permission errors gracefully
        if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
          console.warn('Dashboard statistics unavailable due to permissions, using fallback data');
          setStats({
            activeProjects: 0,
            completedProjects: 0,
            inProduction: 0,
            openComplaints: 0,
            totalProjects: 0,
            totalComplaints: 0
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const modules = [
    {
      id: 'sales',
      title: 'Sales',
      subtitle: 'Submit new projects',
      icon: DollarSign,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      path: '/sales',
      editRoles: ['admin', 'sales'] // Only these roles can edit
    },
    {
      id: 'dne',
      title: 'DNE',
      subtitle: 'Design & Engineering',
      icon: Wrench,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/design',
      editRoles: ['admin', 'designer'] // Only these roles can edit
    },
    {
      id: 'production',
      title: 'Production',
      subtitle: 'Manage production',
      icon: Factory,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      path: '/production',
      editRoles: ['admin', 'production'] // Only these roles can edit
    },
    {
      id: 'installation',
      title: 'Installation',
      subtitle: 'Track installation',
      icon: Hammer,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      path: '/installation',
      editRoles: ['admin', 'installation'] // Only these roles can edit
    },
    {
      id: 'tracker',
      title: 'Master Tracker',
      subtitle: 'Project overview',
      icon: BarChart3,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      path: '/tracker',
      editRoles: ['admin', 'sales', 'designer', 'production', 'installation'] // All roles can view
    },
    {
      id: 'complaints',
      title: 'Complaints',
      subtitle: 'Submit complaints',
      icon: MessageSquare,
      color: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700',
      path: '/complaints',
      editRoles: ['admin', 'sales', 'designer', 'production', 'installation'] // All roles can submit
    }
  ];

  // All modules are visible to all users - no filtering needed
  // Only editing permissions are role-based (handled within each module)
  const accessibleModules = modules;

  const handleModuleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-white/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <MysteelLogo
                size="md"
                variant="icon"
                className="hover:scale-105 transition-transform duration-200"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Progress Tracker
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Mysteel Construction Management</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">Progress Tracker</h1>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/70 rounded-xl px-2 sm:px-4 py-2 shadow-sm border border-white/50">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-medium text-gray-900">{currentUser?.name}</span>
                  <span className="block text-xs text-gray-500 capitalize">
                    {currentUser?.role === 'admin' ? 'System Administrator' : `${currentUser?.role} Department`}
                  </span>
                </div>
                <div className="sm:hidden">
                  <span className="text-xs font-medium text-gray-900 capitalize">{currentUser?.role}</span>
                </div>
              </div>

              {/* Sync Status Button */}
              <button
                onClick={() => setShowSyncDashboard(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
                title="View sync status"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Sync</span>
              </button>

              {/* Profile Settings Button */}
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Profile</span>
              </button>

              {/* Admin Panel Button (only for admins) */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center space-x-1 sm:space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">Admin</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                Welcome back, {currentUser?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 capitalize mb-4">
                {currentUser?.role === 'admin' ? 'System Administrator Dashboard' : `${currentUser?.role} Department Dashboard`}
              </p>

              {/* Network Status Indicator */}
              <NetworkStatus showDetails={false} className="shadow-sm" />
            </div>
          </div>
        </div>

        {/* Collapsible Project Statistics */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 mb-8 sm:mb-12">
          {/* Stats Header */}
          <div 
            className="flex items-center justify-between p-6 sm:p-8 cursor-pointer"
            onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Project Statistics</h2>
                <p className="text-sm text-gray-600">Overview of current project status</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {isStatsCollapsed ? 'Expand' : 'Collapse'}
              </span>
              {isStatsCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>

          {/* Collapsible Stats Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isStatsCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                {/* Active Projects */}
                <div className="group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {loading ? '...' : stats.activeProjects}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">In progress</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
                  <p className="text-gray-600 text-sm mb-3">Currently in progress across all departments</p>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalProjects > 0 ? (stats.activeProjects / stats.totalProjects) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Completed Projects */}
                <div className="group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        {loading ? '...' : stats.completedProjects}
                      </p>
                      <p className="text-xs text-green-600 font-medium">Completed</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Projects</h3>
                  <p className="text-gray-600 text-sm mb-3">Successfully delivered</p>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* In Production */}
                <div className="group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Factory className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {loading ? '...' : stats.inProduction}
                      </p>
                      <p className="text-xs text-orange-600 font-medium">In production</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">In Production</h3>
                  <p className="text-gray-600 text-sm mb-3">Manufacturing and assembly phase</p>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalProjects > 0 ? (stats.inProduction / stats.totalProjects) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Module Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {accessibleModules.map((module, index) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module.path)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] border border-white/50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Glow Effect */}
                <div className={`absolute inset-0 ${module.color} rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300`}></div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${module.color} rounded-2xl mb-4 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-gray-800 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base group-hover:text-gray-700 transition-colors">
                    {module.subtitle}
                  </p>

                  {/* Action */}
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                    <span>Access Module</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Mobile Touch Indicator */}
                <div className="sm:hidden absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full opacity-50"></div>
              </div>
            );
          })}
        </div>



        {/* Mobile-Optimized Footer */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-xs sm:text-sm text-gray-600 border border-white/50">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Footer with Version Info */}
      {/* <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>© 2025 Mysteel Construction Management</span>
              <VersionDisplay variant="badge" />
            </div>
            <div className="flex items-center space-x-4">
              <NetworkStatus showDetails={false} className="text-xs" />
            </div>
          </div>
        </div>
      </footer> */}

      {/* Sync Status Dashboard */}
      <SyncStatusDashboard
        isOpen={showSyncDashboard}
        onClose={() => setShowSyncDashboard(false)}
      />
    </div>
  );
};

export default Dashboard;
