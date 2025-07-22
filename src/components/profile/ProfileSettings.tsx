import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ModuleContainer from '../common/ModuleContainer';
import { User, Shield, Calendar, Clock, Save, Edit3, Key } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    employeeId: currentUser?.employeeId || ''
  });

  const handleSave = () => {
    // TODO: Implement profile update functionality
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      employeeId: currentUser?.employeeId || ''
    });
    setIsEditing(false);
  };

  return (
    <ModuleContainer
      title="Profile Settings"
      subtitle="Manage your account settings and preferences"
      icon={User}
      iconColor="text-white"
      iconBgColor="bg-gradient-to-r from-blue-500 to-purple-600"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all duration-200"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isEditing ? 'Cancel' : 'Edit'}
              </span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">
                  {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{currentUser?.name}</h4>
                <p className="text-sm text-gray-600 capitalize">
                  {currentUser?.role === 'admin' ? 'System Administrator' : `${currentUser?.role} Department`}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-500">Active</span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                    {currentUser?.name || 'Not set'}
                  </div>
                )}
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Employee ID
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-600 font-mono">
                  {currentUser?.employeeId || 'Not assigned'}
                  <span className="text-xs text-gray-500 ml-2">(Primary identifier - contact admin to change)</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Role
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-600 capitalize">
                  {currentUser?.role || 'Not assigned'}
                  <span className="text-xs text-gray-500 ml-2">(Contact admin to change)</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Created</p>
                    <p className="text-xs text-gray-500">
                      {currentUser?.createdAt 
                        ? (currentUser.createdAt instanceof Date 
                          ? currentUser.createdAt.toLocaleDateString() 
                          : 'N/A')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Login</p>
                    <p className="text-xs text-gray-500">
                      Last active session
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h3>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/change-password')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:bg-gray-400 transition-colors"></div>
            </button>
          </div>
        </div>
      </div>
    </ModuleContainer>
  );
};

export default ProfileSettings;
