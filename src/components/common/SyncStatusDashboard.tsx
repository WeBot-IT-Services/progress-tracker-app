import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react';
import { projectsService, milestonesService } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  syncErrors: string[];
  projectCount: number;
  milestoneCount: number;
  lastDataFetch: Date | null;
  firestoreConnected: boolean;
}

interface SyncStatusDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    syncInProgress: false,
    syncErrors: [],
    projectCount: 0,
    milestoneCount: 0,
    lastDataFetch: null,
    firestoreConnected: false
  });

  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load real data from Firestore
  useEffect(() => {
    const loadFirestoreData = async () => {
      if (!currentUser) return;
      
      try {
        setSyncStatus(prev => ({ ...prev, syncInProgress: true, syncErrors: [] }));
        
        // Fetch projects from Firestore
        const projects = await projectsService.getProjects();
        
        // Get milestones for all projects
        let totalMilestones = 0;
        if (projects.length > 0) {
          const milestonePromises = projects.map(project => 
            project.id ? milestonesService.getMilestonesByProject(project.id) : Promise.resolve([])
          );
          const allMilestones = await Promise.all(milestonePromises);
          totalMilestones = allMilestones.reduce((total, milestones) => total + milestones.length, 0);
        }
        
        setSyncStatus(prev => ({
          ...prev,
          syncInProgress: false,
          projectCount: projects.length,
          milestoneCount: totalMilestones,
          lastDataFetch: new Date(),
          lastSync: new Date(),
          firestoreConnected: true,
          syncErrors: []
        }));
        
      } catch (error) {
        console.error('Error loading Firestore data:', error);
        setSyncStatus(prev => ({
          ...prev,
          syncInProgress: false,
          firestoreConnected: false,
          syncErrors: [error?.message || 'Failed to connect to Firestore']
        }));
      }
    };

    loadFirestoreData();
  }, [currentUser]);

  const handleManualSync = async () => {
    if (!currentUser) return;
    
    setSyncStatus(prev => ({ ...prev, syncInProgress: true, syncErrors: [] }));
    
    try {
      // Force refresh data from Firestore
      const projects = await projectsService.getProjects();
      
      // Get milestones for all projects
      let totalMilestones = 0;
      if (projects.length > 0) {
        const milestonePromises = projects.map(project => 
          project.id ? milestonesService.getMilestonesByProject(project.id) : Promise.resolve([])
        );
        const allMilestones = await Promise.all(milestonePromises);
        totalMilestones = allMilestones.reduce((total, milestones) => total + milestones.length, 0);
      }
      
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        projectCount: projects.length,
        milestoneCount: totalMilestones,
        lastDataFetch: new Date(),
        lastSync: new Date(),
        firestoreConnected: true,
        syncErrors: []
      }));
      
    } catch (error) {
      console.error('Error during manual sync:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        firestoreConnected: false,
        syncErrors: [error?.message || 'Sync failed']
      }));
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (syncStatus.syncInProgress) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    if (syncStatus.syncErrors.length > 0) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.syncErrors.length > 0) return 'Sync Issues';
    if (!syncStatus.firestoreConnected) return 'Disconnected';
    return `Synced (${syncStatus.projectCount} projects)`;
  };

  return (
    <>
      {/* Inline xDisplay */}
      {!isOpen && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-700">
                {getStatusText()}
              </span>
            </div>
            
            <button
              onClick={handleManualSync}
              disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Manual sync"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {syncStatus.lastDataFetch && (
            <div className="mt-2 text-xs text-gray-500">
              Last fetch: {syncStatus.lastDataFetch.toLocaleTimeString()} • {syncStatus.milestoneCount} milestones
            </div>
          )}
          
          {syncStatus.syncErrors.length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {syncStatus.syncErrors[0]}
            </div>
          )}
        </div>
      )}

      {/* Modal Display */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Sync Status</h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon()}
                  <span className="text-base font-medium text-gray-700">
                    {getStatusText()}
                  </span>
                </div>
                
                {/* Real-time data counts */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-800">Projects</div>
                    <div className="text-blue-600">{syncStatus.projectCount}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="font-medium text-green-800">Milestones</div>
                    <div className="text-green-600">{syncStatus.milestoneCount}</div>
                  </div>
                </div>
                
                {syncStatus.lastDataFetch && (
                  <div className="text-sm text-gray-500">
                    Last data fetch: {syncStatus.lastDataFetch.toLocaleString()}
                  </div>
                )}
                
                {syncStatus.lastSync && (
                  <div className="text-sm text-gray-500">
                    Last sync: {syncStatus.lastSync.toLocaleString()}
                  </div>
                )}
                
                {syncStatus.syncErrors.length > 0 && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    <div className="font-medium">Sync Errors:</div>
                    <ul className="mt-1 space-y-1">
                      {syncStatus.syncErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button
                  onClick={handleManualSync}
                  disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
                  <span>{syncStatus.syncInProgress ? 'Syncing...' : 'Refresh Data'}</span>
                </button>
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SyncStatusDashboard;
