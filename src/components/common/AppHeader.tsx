import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Activity, ChevronDown } from 'lucide-react';
import MysteelLogo from './MysteelLogo';

interface AppHeaderProps {
  showBackButton?: boolean;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  showBackButton = false, 
  className = '' 
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-xl shadow-xl border-b border-white/30 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <MysteelLogo
              size="md"
              variant="icon"
              className="hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => navigate('/')}
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
            {/* <button
              onClick={() => {}}
              className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
              title="View sync status"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Sync</span>
            </button> */}

            {/* Profile Settings Button */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
              title="Profile Settings"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Profile</span>
            </button>

            {/* Admin Panel Button (only for admins) */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
                title="Admin Panel"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Admin</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 sm:space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
