import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Settings,
  Database,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllUsers, saveUser, deleteUser } from '../../services/offlineStorage';
import { usersService } from '../../services/firebaseService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { addNetworkListener, forceSync } from '../../services/syncService';
import type { User as AppUser, UserRole } from '../../types';

/**
 * AdminPanel Component
 *
 * This component serves as both the administrative user management interface
 * and the user settings interface for the Progress Tracker application.
 *
 * Features:
 * - User creation, editing, and deletion
 * - Role-based access control
 * - Offline/online synchronization
 * - Responsive design for mobile, tablet, and desktop
 * - Firebase Authentication integration
 *
 * Access: Admin role only
 */
const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales' as UserRole,
    department: ''
  });
  const [saving, setSaving] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  // Network status listener
  useEffect(() => {
    const unsubscribe = addNetworkListener(setIsOnline);
    return unsubscribe;
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Try to load from Firebase first, fallback to local storage
      try {
        const firebaseUsers = await usersService.getUsers();
        // Convert Firebase users to AppUser format
        const appUsers: AppUser[] = firebaseUsers.map(user => ({
          uid: (user as any).uid || user.id || '',
          name: user.name,
          email: user.email,
          role: user.role,
          department: (user as any).department,
          createdAt: (user as any).createdAt?.toDate?.() || new Date(),
          updatedAt: (user as any).updatedAt?.toDate?.() || new Date()
        }));
        setUsers(appUsers);
      } catch (firebaseError) {
        console.warn('Firebase users loading failed, using local storage:', firebaseError);
        const localUsers = await getAllUsers();
        setUsers(localUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'sales',
      department: ''
    });
    setEditingUser(null);
    setShowAddUser(true);
  };

  const handleEditUser = (user: AppUser) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password for security
      role: user.role,
      department: user.department || ''
    });
    setEditingUser(user);
    setShowAddUser(true);
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);
      console.log('Starting user save process...', { formData, editingUser });

      // Validate form data
      if (!formData.name.trim() || !formData.email.trim()) {
        alert('Name and email are required');
        setSaving(false);
        return;
      }

      if (!editingUser && !formData.password.trim()) {
        alert('Password is required for new users');
        setSaving(false);
        return;
      }

      if (!editingUser && formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        setSaving(false);
        return;
      }

      // Check if email already exists (for new users)
      if (!editingUser && users.some(u => u.email === formData.email)) {
        alert('A user with this email already exists');
        setSaving(false);
        return;
      }

      console.log('Validation passed, proceeding with user creation/update...');

      if (editingUser) {
        // Update existing user in Firestore
        try {
          // Find the user document by UID
          const firebaseUsers = await usersService.getUsers();
          const existingUser = firebaseUsers.find(u => (u as any).uid === editingUser.uid || u.email === editingUser.email);

          if (existingUser && existingUser.id) {
            await usersService.updateUser(existingUser.id, {
              name: formData.name,
              email: formData.email,
              role: formData.role,
              updatedAt: new Date()
            } as any);

            // Update local state
            const updatedUser: AppUser = {
              ...editingUser,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              department: formData.department || undefined,
              updatedAt: new Date()
            };
            setUsers(users.map(u => u.uid === updatedUser.uid ? updatedUser : u));

            alert('User updated successfully!');
          } else {
            throw new Error('User not found in Firebase');
          }
        } catch (firebaseError) {
          console.warn('Firebase update failed, updating locally:', firebaseError);
          // Fallback to local storage
          const updatedUser: AppUser = {
            ...editingUser,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department || undefined,
            updatedAt: new Date()
          };
          await saveUser(updatedUser);
          setUsers(users.map(u => u.uid === updatedUser.uid ? updatedUser : u));
          alert('User updated locally (Firebase unavailable)');
        }
      } else {
        // Create new user with Firebase Auth + Firestore
        try {
          // Create Firebase Authentication user
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );

          // Create Firestore user document using the Firebase UID as document ID
          const userData = {
            uid: userCredential.user.uid,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department || undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Save to Firestore with UID as document ID
          await usersService.createUser(userData as any);

          // Add to local state
          const newUser: AppUser = userData;
          setUsers([...users, newUser]);
          console.log('User created successfully in Firebase:', newUser);

          alert('User created successfully with Firebase Authentication!');
        } catch (firebaseError) {
          console.warn('Firebase user creation failed, creating locally:', firebaseError);

          // Fallback to local storage only
          const newUser: AppUser = {
            uid: `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department || undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await saveUser(newUser);
          setUsers([...users, newUser]);
          console.log('User created locally:', newUser);

          alert('User created locally (Firebase unavailable). Note: User will not be able to log in until Firebase is available.');
        }
      }

      // Reset form and close modal
      setShowAddUser(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'sales',
        department: ''
      });
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Error saving user: ${(error as any)?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.uid === currentUser?.uid) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await deleteUser(user.uid);
        setUsers(users.filter(u => u.uid !== user.uid));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await forceSync();
      await loadUsers(); // Reload users after sync
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Sync failed. Please check your internet connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sales': return 'bg-green-100 text-green-800';
      case 'designer': return 'bg-blue-100 text-blue-800';
      case 'production': return 'bg-orange-100 text-orange-800';
      case 'installation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return '👑';
      case 'sales': return '💼';
      case 'designer': return '🎨';
      case 'production': return '🏭';
      case 'installation': return '🔧';
      default: return '👤';
    }
  };

  if (currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Module</h1>
                  <p className="text-sm text-gray-600">Manage users, settings, and system analytics</p>
                </div>
              </div>
            </div>

            {/* Network Status & Sync */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {isOnline && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System</p>
                <p className="text-lg font-bold text-gray-900">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <button
                onClick={handleAddUser}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-200"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading users...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 lg:table hidden">
                  {/* Desktop table view */}
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500 mb-2">{user.email}</div>
                              {/* Action buttons positioned under email */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                                  title="Edit User"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </button>
                                {user.uid !== currentUser?.uid && (
                                  <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-200"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            <span className="mr-1">{getRoleIcon(user.role)}</span>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile card view */}
                <div className="lg:hidden space-y-4">
                  {users.map((user) => (
                    <div key={user.uid} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                          <div className="text-sm text-gray-500 truncate mb-2">{user.email}</div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              <span className="mr-1">{getRoleIcon(user.role)}</span>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                            {user.department && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {user.department}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 mb-3">
                            Created: {user.createdAt.toLocaleDateString()}
                          </div>

                          {/* Action buttons for mobile */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            {user.uid !== currentUser?.uid && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password (min 6 characters)"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Password is required for new users</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sales">Sales</option>
                  <option value="designer">Designer</option>
                  <option value="production">Production</option>
                  <option value="installation">Installation</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department (Optional)</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter department"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{saving ? 'Saving...' : (editingUser ? 'Update' : 'Add')} User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
