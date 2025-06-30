import React, { useEffect, useState } from 'react';
import { CheckCircle, Download } from 'lucide-react';

interface UpdateManagerProps {
  onUpdateStart?: () => void;
  onUpdateComplete?: () => void;
}

const UpdateManager: React.FC<UpdateManagerProps> = ({
  onUpdateStart,
  onUpdateComplete
}) => {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'preparing' | 'ready' | 'complete'>('idle');
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string>('');

  useEffect(() => {
    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'SW_BACKGROUND_UPDATE_READY':
          console.log('🔄 Background update ready:', payload);
          setUpdateVersion(payload.version);
          setUpdateStatus('preparing');
          onUpdateStart?.();
          // Show subtle notification that update is preparing
          setShowUpdateNotification(true);
          setTimeout(() => setShowUpdateNotification(false), 3000);
          break;

        case 'SW_SEAMLESS_UPDATE_COMPLETE':
          console.log('✅ Seamless update complete:', payload);
          setUpdateStatus('complete');
          setUpdateVersion(payload.version);
          onUpdateComplete?.();
          // Show completion notification
          setShowUpdateNotification(true);
          setTimeout(() => {
            setShowUpdateNotification(false);
            setUpdateStatus('idle');
          }, 4000);
          break;

        default:
          break;
      }
    };

    // Register service worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [onUpdateStart, onUpdateComplete]);

  // No need for complex update logic - service worker handles everything seamlessly

  if (!showUpdateNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 transform transition-all duration-300 ease-in-out">
        {/* Update Icon and Status */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {updateStatus === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Download className="w-6 h-6 text-blue-500 animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">
              {updateStatus === 'preparing' && 'Preparing Update'}
              {updateStatus === 'complete' && 'Update Complete'}
            </h4>

            <p className="text-xs text-gray-600 mt-1">
              {updateStatus === 'preparing' && `Version ${updateVersion} is being prepared in the background`}
              {updateStatus === 'complete' && `Version ${updateVersion} is now active`}
            </p>
          </div>
        </div>

        {/* Subtle progress indicator for preparing state */}
        {updateStatus === 'preparing' && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Success indicator for complete state */}
        {updateStatus === 'complete' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>No restart required - seamlessly updated</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateManager;
