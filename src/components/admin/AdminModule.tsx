import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, BarChart3, UserPlus, Edit, Trash2, Eye, Database, Lock, AlertTriangle, Key, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import { useAuth } from '../../contexts/AuthContext';
import { usersService, statisticsService, type User } from '../../services/firebaseService';
import { safeFormatDate } from '../../utils/dateUtils';
import EmployeeIdManager from './EmployeeIdManager';
import { cleanupOrphanedMilestones, type CleanupResult } from '../../utils/cleanupOrphanedMilestones';
import { getDefaultPassword } from '../../config/defaults';

// Simple testing mode fallback
const testingMode = {
  shouldBypassRoleRestrictions: () => localStorage.getItem('testingMode') === 'true'
};

const AdminModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings' | 'data' | 'security' | 'employee-ids'>('users');
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

  // User management state
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    employeeId: '',
    role: 'sales' as User['role'],
    status: 'active' as User['status']
  });

  // Data management state
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

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

  // Sample data seeding removed for production
  // Test user creation removed for production
  // Security testing removed for production

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

  // User management handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewUser(true);
  };

  // Data management handlers
  const handleCleanupOrphanedMilestones = async () => {
    if (!confirm('This will permanently delete all milestones that reference non-existent projects. This action cannot be undone. Are you sure?')) {
      return;
    }

    setCleanupLoading(true);
    setCleanupResult(null);

    try {
      const result = await cleanupOrphanedMilestones();
      setCleanupResult(result);
    } catch (error) {
      setCleanupResult({
        success: false,
        cleaned: 0,
        errors: [error.message || 'Unknown error occurred'],
        message: `Failed to cleanup orphaned milestones: ${error.message}`
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  // Handle opening edit form
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      employeeId: user.employeeId || '',
      role: user.role,
      status: user.status
    });
    setShowEditUser(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.employeeId})? This action cannot be undone.`)) {
      return;
    }

    try {
      if (!user.employeeId) {
        throw new Error('User does not have an employee ID');
      }

      await usersService.deleteUser(user.employeeId);
      setUsers(users.filter(u => u.employeeId !== user.employeeId));
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleAddUser = () => {
    setUserFormData({
      name: '',
      employeeId: '',
      role: 'sales',
      status: 'active'
    });
    setShowAddUser(true);
  };

  // Save or create user
  const handleSaveUser = async () => {
    try {
      // Validate required fields
      if (!userFormData.name.trim()) {
        alert('Name is required');
        return;
      }

      if (!userFormData.employeeId.trim()) {
        alert('Employee ID is required');
        return;
      }

      if (selectedUser) {
        // Update existing user
        const updates: Partial<User> = {
          name: userFormData.name,
          role: userFormData.role,
          status: userFormData.status
        };

        await usersService.updateUser(selectedUser.employeeId, updates);
        setUsers(users.map(u => u.employeeId === selectedUser.employeeId ? { ...u, ...updates } as User : u));
        alert('User updated successfully!');

      } else {
        // Create new user with employee ID-based authentication
        try {
          // Generate a temporary password for the new user
          const tempPassword = getDefaultPassword(); // Default password - user must change this on first login

          const newUserData = {
            employeeId: userFormData.employeeId,
            name: userFormData.name,
            role: userFormData.role,
            status: userFormData.status,
            isTemporary: true,
            passwordSet: true
          };

          await usersService.createUserWithPassword(newUserData, tempPassword);
          const updatedUsers = await usersService.getUsers();
          setUsers(updatedUsers);
          alert(`User created successfully!\n\nEmployee ID: ${userFormData.employeeId}\nTemporary Password: ${tempPassword}\n\nPlease share these credentials with the user and ask them to change their password after first login.`);
        } catch (createError: any) {
          console.error('User creation error:', createError);
          alert(createError.message || 'Failed to create user.');
          return;
        }
      }

      setShowAddUser(false);
      setShowEditUser(false);
      setSelectedUser(null);

    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.message || 'Failed to save user. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset user password
  const handleResetPassword = async (user: User) => {
    if (!user.employeeId) {
      alert('User does not have an employee ID');
      return;
    }

    const newPassword = getDefaultPassword(); // Default reset password

    if (!confirm(`Reset password for "${user.name}" (${user.employeeId})?\n\nNew password will be: ${newPassword}\n\nPlease share this with the user and ask them to change it after login.`)) {
      return;
    }

    try {
      await usersService.updateUserPassword(user.employeeId, newPassword);
      alert(`Password reset successfully!\n\nEmployee ID: ${user.employeeId}\nNew Password: ${newPassword}\n\nPlease share these credentials with the user.`);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password. Please try again.');
    }
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
    <ModuleContainer
      title="Admin Module"
      subtitle="Manage users, settings, and system analytics"
      icon={Shield}
      iconColor="text-white"
      iconBgColor="bg-gradient-to-r from-purple-500 to-purple-600"
    >
      {/* Tab Navigation */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/50 mb-6">
        <div className="flex flex-col sm:flex-row gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center sm:justify-start px-6 py-4 sm:py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105 sm:scale-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 active:scale-95'
            }`}
            >
              <Users className="w-5 h-5 mr-3" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center justify-center sm:justify-start px-6 py-4 sm:py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105 sm:scale-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 active:scale-95'
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Analytics
            </button>
            {/* <button
              onClick={() => setActiveTab('employee-ids')}
              className={`flex items-center justify-center sm:justify-start px-6 py-4 sm:py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
                activeTab === 'employee-ids'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105 sm:scale-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 active:scale-95'
              }`}
            >
              <Key className="w-5 h-5 mr-3" />
              Employee IDs
            </button> */}
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center justify-center sm:justify-start px-6 py-4 sm:py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
                activeTab === 'data'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105 sm:scale-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 active:scale-95'
              }`}
            >
              <Database className="w-5 h-5 mr-3" />
              Data Management
            </button>
            {/* <button
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

        {/* Tab Content */}
        <div className="mt-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Add User Button */}
            <div className="flex justify-center sm:justify-end">
              <button
                onClick={handleAddUser}
                className="flex items-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 w-full sm:w-auto justify-center font-semibold shadow-lg"
              >
                <UserPlus className="w-6 h-6 mr-3" />
                Add New User
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-500 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-300 animate-pulse"></div>
                </div>
                <p className="mt-6 text-gray-600 font-medium">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-12 border border-purple-100">
                  <Users className="w-20 h-20 text-purple-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No users found</h3>
                  <p className="text-gray-500">Get started by adding your first user</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user, index) => (
                <div
                  key={user.employeeId || (user as any).id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/95"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col space-y-4">
                    {/* User Info Section */}
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{user.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded-lg inline-block mt-1">
                              Employee ID: {user.employeeId || 'Not assigned'}
                            </p>
                            <p className="text-gray-600 text-sm sm:text-base truncate font-medium capitalize">
                              {user.role === 'admin' ? 'System Administrator' : `${user.role} Department`}
                            </p>
                          </div>
                          
                          {/* Action Buttons - Desktop */}
                          <div className="hidden sm:flex items-center space-x-1">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                              title="View user details"
                            >
                              <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                              title="Edit user"
                            >
                              <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="p-3 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                              title="Reset password"
                            >
                              <Key className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                              title="Delete user"
                            >
                              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getRoleColor(user.role)} shadow-sm`}>
                            {user.role ? user.role.toUpperCase() : 'UNKNOWN'}
                          </span>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(user.status)} shadow-sm`}>
                            {user.status ? user.status.toUpperCase() : 'UNKNOWN'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Mobile */}
                    <div className="flex sm:hidden justify-center space-x-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="flex-1 flex items-center justify-center py-3 px-4 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 active:scale-95 font-medium"
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="flex-1 flex items-center justify-center py-3 px-4 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 active:scale-95 font-medium"
                      >
                        <Edit className="w-5 h-5 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="flex-1 flex items-center justify-center py-3 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 active:scale-95 font-medium"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete
                      </button>
                    </div>
                    
                    {/* Footer Info */}
                    <div className="pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-500">
                      <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0 bg-gray-50 rounded-lg p-3">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          Created: {safeFormatDate(user.createdAt) || 'N/A'}
                        </span>
                        {user.lastLogin && (
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                            Last login: {safeFormatDate(user.lastLogin) || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
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

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Database className="w-6 h-6 mr-3 text-purple-600" />
                Database Maintenance
              </h3>

              {/* Orphaned Milestones Cleanup */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                      Orphaned Milestones Cleanup
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Remove milestones that reference deleted projects. This helps maintain database integrity and prevents display issues.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-yellow-800 text-xs">
                        <strong>Warning:</strong> This action permanently deletes orphaned milestone records and cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <button
                    onClick={handleCleanupOrphanedMilestones}
                    disabled={cleanupLoading}
                    className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      cleanupLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    }`}
                  >
                    {cleanupLoading ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5 mr-2" />
                    )}
                    {cleanupLoading ? 'Cleaning up...' : 'Cleanup Orphaned Milestones'}
                  </button>

                  {cleanupResult && (
                    <div className={`flex items-center px-4 py-2 rounded-lg ${
                      cleanupResult.success
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {cleanupResult.success ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      <span className="text-sm font-medium">
                        {cleanupResult.message}
                      </span>
                    </div>
                  )}
                </div>

                {cleanupResult && cleanupResult.errors.length > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-red-800 mb-2">Errors encountered:</h5>
                    <ul className="text-xs text-red-700 space-y-1">
                      {cleanupResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Future data management tools can be added here */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Additional database maintenance tools will be added here as needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Employee ID Manager Tab */}
        {activeTab === 'employee-ids' && (
          <EmployeeIdManager />
        )}
        </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={userFormData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter user name"
                  required
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={userFormData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter employee ID (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  name="role"
                  value={userFormData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="designer">Designer</option>
                  <option value="production">Production</option>
                  <option value="installation">Installation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={userFormData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={userFormData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter user name"
                  required
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={userFormData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter employee ID (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  name="role"
                  value={userFormData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="designer">Designer</option>
                  <option value="production">Production</option>
                  <option value="installation">Installation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={userFormData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h4>
                  <p className="text-gray-600 capitalize">
                    {selectedUser.role === 'admin' ? 'System Administrator' : `${selectedUser.role} Department`}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">
                    Employee ID: {selectedUser.employeeId || 'Not assigned'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-gray-600">
                  {safeFormatDate(selectedUser.createdAt) || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-600">
                  {safeFormatDate(selectedUser.updatedAt) || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewUser(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleContainer>
  );
};

export default AdminModule;
