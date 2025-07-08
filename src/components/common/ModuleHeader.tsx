import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NetworkStatus from './NetworkStatus';

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBgColor: string;
  showBackButton?: boolean;
  backPath?: string;
  children?: React.ReactNode;
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
  showBackButton = true,
  backPath = '/',
  children
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-40 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          {/* First Row - Back button and Network Status */}
          <div className="flex items-center justify-between h-14 border-b border-gray-200/50">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={() => navigate(backPath)}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}

            {/* Network Status and Actions */}
            <div className="flex items-center space-x-2">
              <NetworkStatus />
              {children}
            </div>
          </div>

          {/* Second Row - Module Info */}
          <div className="flex items-center space-x-3 py-4">
            <div className={`flex items-center justify-center w-10 h-10 ${iconBgColor} rounded-lg shadow-lg`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-sm text-gray-600 truncate">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between h-20">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={() => navigate(backPath)}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
            )}

            {/* Module Info */}
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-12 h-12 ${iconBgColor} rounded-xl shadow-lg hover:scale-105 transition-transform duration-200`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <NetworkStatus />

            {/* Additional Actions */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleHeader;
