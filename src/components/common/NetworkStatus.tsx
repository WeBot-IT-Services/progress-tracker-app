import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusProps {
  showDetails?: boolean;
  className?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showDetails = true, 
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null; // Only show when offline

  return (
    <div className={`bg-red-500 text-white px-3 py-2 text-sm flex items-center justify-center ${className}`}>
      <WifiOff className="w-4 h-4 mr-2" />
      {showDetails ? "You're offline. Some features may not be available." : "Offline"}
    </div>
  );
};

export default NetworkStatus;
