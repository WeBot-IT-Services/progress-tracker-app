import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, BarChart3, UserPlus, Edit, Trash2, Eye, Database, Lock, AlertTriangle } from 'lucide-react';
import ModuleHeader from '../common/ModuleHeader';
import FirestorePopulator from './FirestorePopulator';
import { useAuth } from '../../contexts/AuthContext';
import { usersService, statisticsService, type User } from '../../services/firebaseService';
import { seedFirebaseData } from '../../utils/seedData';
import { createAllTestUsers, displayLoginCredentials } from '../../utils/createTestUsers';
import { securityTester } from '../../utils/securityTester';
import { testingMode } from '../../utils/testingMode';

const AdminModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings' | 'data' | 'security'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    inProduction: 0,
    openComplaints: 0,
    totalProjects: 0,
    totalComplaints: 0
  });
  const [seeding, setSeeding] = useState(false);
  const [creatingUsers, setCreatingUsers] = useState(false);
  const [testingRules, setTestingRules] = useState(false);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersData, statsData] = await Promise.all([
          usersService.getUsers(),
          statisticsService.getDashboardStats()
        ]);
        setUsers(usersData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSeedData = async () => {
    if (!confirm('This will add sample data to your Firebase database. Continue?')) return;

    try {
      setSeeding(true);
      await seedFirebaseData();
      alert('Sample data has been successfully added to Firebase!');

      // Reload data
      const [usersData, statsData] = await Promise.all([
        usersService.getUsers(),
        statisticsService.getDashboardStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Failed to seed data. Please check the console for details.');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateTestUsers = async () => {
    if (!confirm('This will create test user accounts for all roles. Continue?')) return;

    try {
      setCreatingUsers(true);
      await createAllTestUsers();
      alert('Test users have been created successfully! Check the console for login credentials.');

      // Reload users
      const usersData = await usersService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error creating test users:', error);
      alert('Failed to create test users. Please check the console for details.');
    } finally {
      setCreatingUsers(false);
    }
  };

  const handleShowCredentials = () => {
    displayLoginCredentials();
    alert('Login credentials have been displayed in the console. Press F12 to view.');
  };

  const handleTestSecurityRules = async () => {
    if (!confirm('This will test Firebase Security Rules with different user roles. Continue?')) return;

    try {
      setTestingRules(true);
      await securityTester.runComprehensiveTests();
      alert('Security rules testing completed! Check the console for detailed results.');
    } catch (error) {
      console.error('Error testing security rules:', error);
      alert('Failed to test security rules. Please check the console for details.');
    } finally {
      setTestingRules(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sales':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'designer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'installation':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // Only allow admin access (unless testing mode is enabled)
  const isTestingMode = testingMode.shouldBypassRoleRestrictions();

  if (currentUser?.role !== 'admin' && !isTestingMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the Admin Module.</p>
          {isTestingMode && (
            <p className="text-blue-600 text-sm mt-2">Testing mode is enabled - access granted for testing</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <ModuleHeader
        title="Admin Module"
        subtitle="Manage users, settings, and system analytics"
        icon={Shield}
        iconColor="text-white"
        iconBgColor="bg-gradient-to-r from-purple-500 to-purple-600"
      >
        <button className="flex items-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </ModuleHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/50 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
            {/* <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'data'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              Data
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'security'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Lock className="w-4 h-4 mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button> */}
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              users.map((user) => (
              <div
                key={user.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                          {user.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Created: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                    {user.lastLogin && (
                      <span>Last login: {user.lastLogin?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.totalProjects}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-green-600">{loading ? '...' : stats.activeProjects}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Projects</p>
                    <p className="text-2xl font-bold text-purple-600">{loading ? '...' : stats.completedProjects}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Complaints</p>
                    <p className="text-2xl font-bold text-red-600">{loading ? '...' : stats.openComplaints}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* User Statistics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{loading ? '...' : users.length}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {loading ? '...' : users.filter(u => u.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {loading ? '...' : users.filter(u => u.role === 'admin').length}
                  </p>
                  <p className="text-sm text-gray-600">Administrators</p>
                </div>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
              <div className="space-y-3">
                {['admin', 'sales', 'designer', 'production', 'installation'].map(role => {
                  const count = users.filter(u => u.role === role).length;
                  const percentage = users.length > 0 ? (count / users.length) * 100 : 0;
                  return (
                    <div key={role} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{role}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getRoleColor(role).split(' ')[0]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
       
      </div>
    </div>
  );
};

export default AdminModule;
