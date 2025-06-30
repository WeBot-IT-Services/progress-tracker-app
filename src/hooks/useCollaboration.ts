import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import { collaborativeService } from '../services/collaborativeService';
import type { DocumentLock, UserPresence } from '../services/collaborativeService';

export interface UseDocumentLockResult {
  isLocked: boolean;
  lockOwner?: DocumentLock;
  isLockOwner: boolean;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<boolean>;
  lockError?: string;
}

export interface UsePresenceResult {
  presence: UserPresence[];
  updatePresence: (action: 'viewing' | 'editing') => Promise<void>;
  removePresence: () => Promise<void>;
}

export interface UseRealtimeDataResult<T> {
  data: T | null;
  loading: boolean;
  error?: string;
}

// Hook for document locking
export function useDocumentLock(
  documentId: string,
  documentType: 'project' | 'milestone',
  user: User | null
): UseDocumentLockResult {
  const [isLocked, setIsLocked] = useState(false);
  const [lockOwner, setLockOwner] = useState<DocumentLock | undefined>();
  const [lockError, setLockError] = useState<string | undefined>();
  const [currentLock, setCurrentLock] = useState<DocumentLock | null>(null);
  
  const isLockOwner = currentLock?.userId === user?.uid;

  // Subscribe to lock changes
  useEffect(() => {
    if (!documentId || !user) return;

    const unsubscribe = collaborativeService.subscribeToLocks(
      documentId,
      documentType,
      (locks) => {
        const activeLock = locks.find(lock => {
          const now = new Date();
          const expiresAt = lock.expiresAt.toDate();
          return expiresAt > now && lock.isActive;
        });

        if (activeLock) {
          setIsLocked(true);
          setLockOwner(activeLock);
          
          // Check if current user owns the lock
          if (activeLock.userId === user.uid) {
            setCurrentLock(activeLock);
          }
        } else {
          setIsLocked(false);
          setLockOwner(undefined);
          setCurrentLock(null);
        }
      }
    );

    return unsubscribe;
  }, [documentId, documentType, user]);

  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setLockError(undefined);
    
    const result = await collaborativeService.acquireLock(
      documentId,
      documentType,
      user
    );

    if (result.success && result.lock) {
      setCurrentLock(result.lock);
      setIsLocked(true);
      setLockOwner(result.lock);
      return true;
    } else {
      setLockError(result.error);
      return false;
    }
  }, [documentId, documentType, user]);

  const releaseLock = useCallback(async (): Promise<boolean> => {
    if (!user || !currentLock) return false;

    const success = await collaborativeService.releaseLock(
      documentId,
      documentType,
      user.uid
    );

    if (success) {
      setCurrentLock(null);
      setIsLocked(false);
      setLockOwner(undefined);
      setLockError(undefined);
    }

    return success;
  }, [documentId, documentType, user, currentLock]);

  // Auto-release lock on unmount
  useEffect(() => {
    return () => {
      if (user && currentLock) {
        collaborativeService.releaseLock(
          documentId,
          documentType,
          user.uid
        );
      }
    };
  }, [documentId, documentType, user, currentLock]);

  return {
    isLocked,
    lockOwner,
    isLockOwner,
    acquireLock,
    releaseLock,
    lockError
  };
}

// Hook for user presence
export function usePresence(
  documentId: string,
  documentType: 'project' | 'milestone',
  user: User | null
): UsePresenceResult {
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const presenceUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to presence changes
  useEffect(() => {
    if (!documentId) return;

    const unsubscribe = collaborativeService.subscribeToPresence(
      documentId,
      documentType,
      (presenceList) => {
        // Filter out current user from presence list
        const otherUsers = presenceList.filter(p => p.userId !== user?.uid);
        setPresence(otherUsers);
      }
    );

    return unsubscribe;
  }, [documentId, documentType, user]);

  const updatePresence = useCallback(async (action: 'viewing' | 'editing') => {
    if (!user) return;

    await collaborativeService.updatePresence(
      documentId,
      documentType,
      action,
      user
    );

    // Set up periodic presence updates
    if (presenceUpdateRef.current) {
      clearInterval(presenceUpdateRef.current);
    }

    presenceUpdateRef.current = setInterval(() => {
      collaborativeService.updatePresence(
        documentId,
        documentType,
        action,
        user
      );
    }, 15000); // Update every 15 seconds
  }, [documentId, documentType, user]);

  const removePresence = useCallback(async () => {
    if (!user) return;

    // Clear interval
    if (presenceUpdateRef.current) {
      clearInterval(presenceUpdateRef.current);
      presenceUpdateRef.current = null;
    }

    await collaborativeService.removePresence(
      documentId,
      documentType,
      user.uid
    );
  }, [documentId, documentType, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (presenceUpdateRef.current) {
        clearInterval(presenceUpdateRef.current);
      }
      if (user) {
        collaborativeService.removePresence(
          documentId,
          documentType,
          user.uid
        );
      }
    };
  }, [documentId, documentType, user]);

  return {
    presence,
    updatePresence,
    removePresence
  };
}

// Hook for real-time data updates
export function useRealtimeData<T>(
  collectionName: string,
  documentId: string,
  transform?: (data: any) => T
): UseRealtimeDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    // Import Firebase functions dynamically to avoid circular dependencies
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      import('../config/firebase').then(({ db }) => {
        const docRef = doc(db, collectionName, documentId);
        
        const unsubscribe = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const rawData = { id: snapshot.id, ...snapshot.data() };
              const transformedData = transform ? transform(rawData) : rawData as T;
              setData(transformedData);
            } else {
              setData(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error('Real-time data error:', err);
            setError('Failed to load real-time data');
            setLoading(false);
          }
        );

        return unsubscribe;
      });
    });
  }, [collectionName, documentId, transform]);

  return { data, loading, error };
}

// Hook for handling page visibility and cleanup
export function useCollaborationCleanup(
  documentId: string,
  documentType: 'project' | 'milestone',
  user: User | null
) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && user) {
        // User switched tabs or minimized window
        collaborativeService.removePresence(
          documentId,
          documentType,
          user.uid
        );
      }
    };

    const handleBeforeUnload = () => {
      if (user) {
        // User is leaving the page
        collaborativeService.releaseLock(
          documentId,
          documentType,
          user.uid
        );
        collaborativeService.removePresence(
          documentId,
          documentType,
          user.uid
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [documentId, documentType, user]);
}
