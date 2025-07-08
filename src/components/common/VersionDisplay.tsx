import React from 'react';
import { APP_VERSION } from '../../config/version';

interface VersionDisplayProps {
  variant?: 'badge' | 'text' | 'full';
  className?: string;
}

const VersionDisplay: React.FC<VersionDisplayProps> = ({ 
  variant = 'text', 
  className = '' 
}) => {
  const getVersionInfo = () => {
    try {
      return {
        version: APP_VERSION || '3.15.0',
        buildDate: new Date().toISOString().split('T')[0],
        environment: import.meta.env.DEV ? 'development' : 'production'
      };
    } catch (error) {
      return {
        version: '3.15.0',
        buildDate: new Date().toISOString().split('T')[0],
        environment: 'production'
      };
    }
  };

  const versionInfo = getVersionInfo();

  const renderBadge = () => (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
      v{versionInfo.version}
    </span>
  );

  const renderText = () => (
    <span className={`text-sm text-gray-500 ${className}`}>
      v{versionInfo.version}
    </span>
  );

  const renderFull = () => (
    <div className={`text-xs text-gray-500 ${className}`}>
      <div>Version: {versionInfo.version}</div>
      <div>Build: {versionInfo.buildDate}</div>
      <div>Env: {versionInfo.environment}</div>
    </div>
  );

  switch (variant) {
    case 'badge':
      return renderBadge();
    case 'full':
      return renderFull();
    case 'text':
    default:
      return renderText();
  }
};

export default VersionDisplay;
