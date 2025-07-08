import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import NetworkStatus from './NetworkStatus';

interface ModuleContainerProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
  maxWidth?: string;
  fullViewport?: boolean;
  showBackButton?: boolean;
  backPath?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({
  title,
  subtitle,
  icon: IconComponent,
  iconColor = "text-white",
  iconBgColor = "bg-blue-500",
  className = "",
  maxWidth = "max-w-7xl",
  fullViewport = false,
  showBackButton = true,
  backPath = "/",
  headerActions,
  children
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1); // Go back in history
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className}`}>
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-white/30 sticky top-0 z-50">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center">
              {/* Back Button */}
              {showBackButton && (
                <button
                  onClick={handleBackClick}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  title="Go back to dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Back</span>
                </button>
              )}

              {/* Title Section */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 ${iconBgColor} rounded-2xl shadow-lg`}>
                  <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColor}`} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600">{subtitle}</p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            {headerActions && (
              <div className="flex items-center space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Status */}
      <NetworkStatus />

      {/* Main Content */}
      <main className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8`}>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ModuleContainer;
