import React from 'react';

interface MysteelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full' | 'text';
  className?: string;
}

const MysteelLogo: React.FC<MysteelLogoProps> = ({ 
  size = 'md', 
  variant = 'icon',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Professional construction/steel industry logo SVG
  const LogoIcon = () => (
    <svg 
      viewBox="0 0 100 100" 
      className={iconSizes[size]}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Steel beam structure */}
      <g fill="currentColor">
        {/* Main vertical beam */}
        <rect x="45" y="10" width="10" height="80" rx="2" />
        
        {/* Horizontal beams */}
        <rect x="20" y="25" width="60" height="8" rx="2" />
        <rect x="25" y="45" width="50" height="8" rx="2" />
        <rect x="30" y="65" width="40" height="8" rx="2" />
        
        {/* Support struts */}
        <rect x="35" y="30" width="6" height="20" rx="1" transform="rotate(45 38 40)" />
        <rect x="59" y="30" width="6" height="20" rx="1" transform="rotate(-45 62 40)" />
        
        {/* Base foundation */}
        <rect x="15" y="85" width="70" height="12" rx="3" />
        
        {/* Rivets/bolts */}
        <circle cx="25" cy="29" r="2" />
        <circle cx="75" cy="29" r="2" />
        <circle cx="30" cy="49" r="2" />
        <circle cx="70" cy="49" r="2" />
        <circle cx="35" cy="69" r="2" />
        <circle cx="65" cy="69" r="2" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl shadow-lg text-white`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`${sizeClasses[size]} flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl shadow-lg text-white`}>
          <LogoIcon />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Progress Tracker</h1>
          <p className="text-sm text-gray-600">Mysteel Construction</p>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`text-center space-y-4 ${className}`}>
        <div className={`${sizeClasses[size]} mx-auto flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-3xl shadow-2xl text-white`}>
          <LogoIcon />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Progress
            </span>
            <br />
            <span className="text-white">Tracker</span>
          </h1>
          <p className="text-blue-200 text-lg font-medium mt-2">
            Mysteel Construction Management
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default MysteelLogo;
