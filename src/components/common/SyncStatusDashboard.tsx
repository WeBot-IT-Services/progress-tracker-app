import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  X,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { 
  addSyncListener, 
  getSyncStatus, 
  forceSync, 
  retryFailedActions,
  getConflicts,
  resolveConflict 
} from '../../services/syncService';

interface SyncStatus {
  isSyncing: boolean;
  isOnline: boolean;
  pendingActions: number;
  failedActions: number;
  conflicts: number;
  lastSyncTime: Date | null;
  syncProgress: number;
  currentOperation?: string;
}

interface SyncStatusDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({ isOpen, onClose }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Listen for sync status changes
    const removeSyncListener = addSyncListener((status) => {
      setSyncStatus(status);
    });

    // Load conflicts
    loadConflicts();

    return () => {
      removeSyncListener();
    };
  }, [isOpen]);

  const loadConflicts = async () => {
    try {
      const conflictList = await getConflicts();
      setConflicts(conflictList.filter(c => c.status === 'pending'));
    } catch (error) {
      console.error('Error loading conflicts:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    try {
      await retryFailedActions();
    } catch (error) {
      console.error('Retry failed actions error:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'client-wins' | 'server-wins') => {
    setIsResolvingConflicts(true);
    try {
      await resolveConflict(conflictId, resolution);
      await loadConflicts();
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setIsResolvingConflicts(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Sync Status Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {syncStatus.isOnline ? (
                <Wifi className="w-6 h-6 text-green-500" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </h3>
                <p className="text-sm text-gray-600">
                  {syncStatus.isOnline 
                    ? 'Connected to server' 
                    : 'Working offline - changes will sync when connection is restored'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Sync Progress */}
          {syncStatus.isSyncing && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Syncing...</h3>
                  <p className="text-sm text-gray-600">{syncStatus.currentOperation}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncStatus.syncProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {syncStatus.syncProgress}% complete
              </p>
            </div>
          )}

          {/* Status Counters */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{syncStatus.pendingActions}</div>
              <div className="text-sm text-gray-600">Pending Actions</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{syncStatus.failedActions}</div>
              <div className="text-sm text-gray-600">Failed Actions</div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{syncStatus.conflicts}</div>
              <div className="text-sm text-gray-600">Conflicts</div>
            </div>
          </div>

          {/* Last Sync Time */}
          {syncStatus.lastSyncTime && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  Last sync: {syncStatus.lastSyncTime.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Conflicts Section */}
          {conflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span>Data Conflicts ({conflicts.length})</span>
              </h3>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {conflict.entityType} - {conflict.entityId}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Conflict detected between local and server changes
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleResolveConflict(conflict.id, 'client-wins')}
                          disabled={isResolvingConflicts}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded transition-colors disabled:opacity-50"
                        >
                          Keep Local
                        </button>
                        <button
                          onClick={() => handleResolveConflict(conflict.id, 'server-wins')}
                          disabled={isResolvingConflicts}
                          className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded transition-colors disabled:opacity-50"
                        >
                          Keep Server
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            {syncStatus.isOnline && !syncStatus.isSyncing && (
              <button
                onClick={handleForceSync}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Force Sync</span>
              </button>
            )}

            {syncStatus.failedActions > 0 && (
              <button
                onClick={handleRetryFailed}
                disabled={isRetrying}
                className="flex-1 flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Retrying...' : 'Retry Failed'}</span>
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="mb-1"><strong>Pending Actions:</strong> Changes waiting to be synchronized</p>
            <p className="mb-1"><strong>Failed Actions:</strong> Operations that failed and need retry</p>
            <p><strong>Conflicts:</strong> Data conflicts requiring manual resolution</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusDashboard;
