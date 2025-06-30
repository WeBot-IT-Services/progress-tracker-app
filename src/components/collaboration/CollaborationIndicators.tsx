import React from 'react';
import { 
  Lock, 
  Eye, 
  Edit3, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
import type { DocumentLock, UserPresence } from '../../services/collaborativeService';

interface LockIndicatorProps {
  lock?: DocumentLock;
  isLockOwner: boolean;
  className?: string;
}

export const LockIndicator: React.FC<LockIndicatorProps> = ({ 
  lock, 
  isLockOwner, 
  className = '' 
}) => {
  if (!lock) return null;

  const timeRemaining = Math.max(0, lock.expiresAt.toDate().getTime() - Date.now());
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
        isLockOwner 
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}>
        <Lock className="w-3 h-3" />
        <span>
          {isLockOwner 
            ? `You are editing (${minutesRemaining}m left)` 
            : `Locked by ${lock.userName}`
          }
        </span>
      </div>
      
      {!isLockOwner && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{minutesRemaining}m remaining</span>
        </div>
      )}
    </div>
  );
};

interface PresenceIndicatorProps {
  presence: UserPresence[];
  className?: string;
  maxVisible?: number;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ 
  presence, 
  className = '',
  maxVisible = 3
}) => {
  if (presence.length === 0) return null;

  const visibleUsers = presence.slice(0, maxVisible);
  const hiddenCount = Math.max(0, presence.length - maxVisible);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-600">
          {presence.length} user{presence.length !== 1 ? 's' : ''} active
        </span>
      </div>
      
      <div className="flex items-center -space-x-1">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className="relative group"
            title={`${user.userName} is ${user.action}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium ${
              user.action === 'editing' 
                ? 'bg-orange-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              {user.action === 'editing' ? (
                <Edit3 className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {user.userName} is {user.action}
            </div>
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 text-white flex items-center justify-center text-xs font-medium">
            +{hiddenCount}
          </div>
        )}
      </div>
    </div>
  );
};

interface CollaborationStatusProps {
  lock?: DocumentLock;
  presence: UserPresence[];
  isLockOwner: boolean;
  lockError?: string;
  onRequestEdit?: () => void;
  className?: string;
}

export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  lock,
  presence,
  isLockOwner,
  lockError,
  onRequestEdit,
  className = ''
}) => {
  const hasActiveLock = !!lock;
  const canEdit = !hasActiveLock || isLockOwner;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Lock Status */}
      {hasActiveLock && (
        <LockIndicator 
          lock={lock} 
          isLockOwner={isLockOwner}
          className="mb-2"
        />
      )}
      
      {/* Lock Error */}
      {lockError && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{lockError}</span>
        </div>
      )}
      
      {/* Edit Status */}
      {!hasActiveLock && onRequestEdit && (
        <button
          onClick={onRequestEdit}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Edit3 className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-blue-700">Click to start editing</span>
        </button>
      )}
      
      {canEdit && hasActiveLock && isLockOwner && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-700">You can edit this document</span>
        </div>
      )}
      
      {/* Presence Indicator */}
      {presence.length > 0 && (
        <PresenceIndicator 
          presence={presence}
          className="pt-2 border-t border-gray-200"
        />
      )}
    </div>
  );
};

interface UserAvatarProps {
  user: UserPresence;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showStatus = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const statusColors = {
    editing: 'bg-orange-500',
    viewing: 'bg-blue-500'
  };

  const initials = user.userName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative ${className}`}>
      <div className={`
        ${sizeClasses[size]} 
        ${statusColors[user.action]} 
        rounded-full 
        flex items-center justify-center 
        text-white font-medium 
        border-2 border-white 
        shadow-sm
      `}>
        {initials || <User className="w-3 h-3" />}
      </div>
      
      {showStatus && (
        <div className={`
          absolute -bottom-1 -right-1 
          w-3 h-3 
          rounded-full 
          border border-white
          ${user.action === 'editing' ? 'bg-orange-400' : 'bg-blue-400'}
        `} />
      )}
    </div>
  );
};

interface CollaborationBannerProps {
  lock?: DocumentLock;
  isLockOwner: boolean;
  presence: UserPresence[];
  onRequestEdit?: () => void;
  onReleaseLock?: () => void;
  className?: string;
}

export const CollaborationBanner: React.FC<CollaborationBannerProps> = ({
  lock,
  isLockOwner,
  presence,
  onRequestEdit,
  onReleaseLock,
  className = ''
}) => {
  if (!lock && presence.length === 0) return null;

  return (
    <div className={`bg-gray-50 border-l-4 border-blue-500 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {lock && (
            <LockIndicator 
              lock={lock} 
              isLockOwner={isLockOwner}
            />
          )}
          
          {presence.length > 0 && (
            <PresenceIndicator presence={presence} />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!lock && onRequestEdit && (
            <button
              onClick={onRequestEdit}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Editing
            </button>
          )}
          
          {lock && isLockOwner && onReleaseLock && (
            <button
              onClick={onReleaseLock}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
            >
              Stop Editing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
