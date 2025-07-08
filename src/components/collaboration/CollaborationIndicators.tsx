import React from 'react';
import { Users, Eye, Clock, Lock } from 'lucide-react';

interface CollaborationBannerProps {
  users?: Array<{ name: string; isActive: boolean }>;
  className?: string;
}

export const CollaborationBanner: React.FC<CollaborationBannerProps> = ({ 
  users = [], 
  className = '' 
}) => {
  if (!users.length) return null;

  const activeUsers = users.filter(user => user.isActive);
  
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} viewing
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {activeUsers.slice(0, 3).map((user, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-blue-700">{user.name}</span>
            </div>
          ))}
          {activeUsers.length > 3 && (
            <span className="text-xs text-blue-600">+{activeUsers.length - 3} more</span>
          )}
        </div>
      </div>
    </div>
  );
};

interface CollaborationStatusProps {
  isLocked?: boolean;
  lockedBy?: string;
  lastModified?: Date;
  className?: string;
}

export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  isLocked = false,
  lockedBy,
  lastModified,
  className = ''
}) => {
  if (!isLocked && !lastModified) return null;

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {isLocked && (
        <div className="flex items-center space-x-1 text-amber-600">
          <Lock className="w-4 h-4" />
          <span>Locked by {lockedBy}</span>
        </div>
      )}
      {lastModified && (
        <div className="flex items-center space-x-1 text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Modified {lastModified.toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

export default { CollaborationBanner, CollaborationStatus };
