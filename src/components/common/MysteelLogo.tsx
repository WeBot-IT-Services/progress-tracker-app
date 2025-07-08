import React from 'react';
import logoImage from '../../assets/MYSTEEL定稿 (3).png';

interface MysteelLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'large';
  variant?: 'icon' | 'full' | 'text' | 'header' | 'login';
  className?: string;
  showText?: boolean; // New prop to control text display
  onClick?: () => void; // New prop for click handler
}

const MysteelLogo: React.FC<MysteelLogoProps> = ({ 
  size = 'md', 
  variant = 'icon',
  className = '',
  showText = true,
  onClick
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    'large': 'w-32 h-32'
  };

  // Logo Image Component
  const LogoImage = () => (
    <img
      src={logoImage}
      alt="Mysteel Logo"
      className="w-full h-full object-contain select-none"
    />
  );

  if (variant === 'icon') {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} flex items-center justify-center p-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={onClick}
      >
        <LogoImage />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`${sizeClasses[size]} flex items-center justify-center p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-shrink-0`}>
          <LogoImage />
        </div>
        {showText && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Progress Tracker</h1>
            {/* <p className="text-xs text-gray-600 font-medium leading-tight">Mysteel Construction Management</p> */}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`text-center space-y-6 ${className}`}>
        <div className={`${sizeClasses[size]} mx-auto flex items-center justify-center p-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden`}>
          <LogoImage />
        </div>
        {showText && (
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm">
                Progress
              </span>
              <br />
              <span className="text-white drop-shadow-md">Tracker</span>
            </h1>
            {/* <p className="text-blue-100/90 text-base md:text-lg font-medium tracking-wide">
              Mysteel Construction Management
            </p> */}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses[size]} flex items-center justify-center p-1 bg-white rounded-lg overflow-hidden flex-shrink-0`}>
          <LogoImage />
        </div>
        {showText && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 leading-none">Progress Tracker</h1>
            <p className="text-xs text-gray-500 font-medium leading-none mt-0.5">Mysteel Construction</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={`text-center space-y-4 ${className}`}>
        <div className={`${sizeClasses[size]} mx-auto flex items-center justify-center p-3 bg-white rounded-2xl shadow-xl border-2 border-blue-100 overflow-hidden`}>
          <LogoImage />
        </div>
        {showText && (
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Progress Tracker
              </span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              Mysteel Construction Management
            </p>
            <p className="text-xs text-gray-500">
              Secure Project Management System
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default MysteelLogo;
