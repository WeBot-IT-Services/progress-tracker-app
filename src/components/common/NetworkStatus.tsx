import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { addNetworkListener, getSyncStatus, addSyncListener } from '../../services/syncService';

interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Listen for network changes
    const unsubscribeNetwork = addNetworkListener(setIsOnline);
    
    // Listen for sync status changes
    const unsubscribeSync = addSyncListener(() => {
      setSyncStatus(getSyncStatus());
    });

    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 5000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
    
    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }
    
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    
    return 'Online';
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    
    if (syncStatus.isSyncing) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getDetailedStatus = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-5 h-5 text-red-500" />,
        title: 'Offline Mode',
        description: 'Working offline. Changes will sync when connection is restored.',
        color: 'border-red-200 bg-red-50'
      };
    }
    
    if (syncStatus.isSyncing) {
      return {
        icon: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
        title: 'Syncing Data',
        description: 'Synchronizing your changes with the server...',
        color: 'border-blue-200 bg-blue-50'
      };
    }
    
    return {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      title: 'Connected',
      description: 'All data is synchronized and up to date.',
      color: 'border-green-200 bg-green-50'
    };
  };

  if (showDetails) {
    const status = getDetailedStatus();
    
    return (
      <div className={`rounded-xl border p-4 ${status.color} ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {status.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {status.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {status.description}
            </p>
            {syncStatus.lastSyncTime && (
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last sync: {syncStatus.lastSyncTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${getStatusColor()} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
          {!isOnline ? (
            'Working offline - changes will sync when online'
          ) : syncStatus.isSyncing ? (
            'Synchronizing data with server'
          ) : (
            'Connected and synchronized'
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Compact version for mobile
export const NetworkStatusCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  useEffect(() => {
    const unsubscribeNetwork = addNetworkListener(setIsOnline);
    const unsubscribeSync = addSyncListener(() => {
      setSyncStatus(getSyncStatus());
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  const getStatusIndicator = () => {
    if (!isOnline) {
      return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
    }
    
    if (syncStatus.isSyncing) {
      return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />;
    }
    
    return <div className="w-2 h-2 bg-green-500 rounded-full" />;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIndicator()}
      <span className="text-xs text-gray-600">
        {!isOnline ? 'Offline' : syncStatus.isSyncing ? 'Sync' : 'Online'}
      </span>
    </div>
  );
};

// Hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  useEffect(() => {
    const unsubscribeNetwork = addNetworkListener(setIsOnline);
    const unsubscribeSync = addSyncListener(() => {
      setSyncStatus(getSyncStatus());
    });

    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 5000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    isSyncing: syncStatus.isSyncing,
    lastSyncTime: syncStatus.lastSyncTime
  };
};

export default NetworkStatus;
