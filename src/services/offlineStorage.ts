// Offline Storage Service using IndexedDB
import type { User as AppUser, Project } from '../types';

// IndexedDB configuration
const DB_NAME = 'ProgressTrackerDB';
const DB_VERSION = 2; // Incremented to trigger upgrade

// Store names
const STORES = {
  AUTH: 'auth',
  PROJECTS: 'projects',
  USERS: 'users',
  COMPLAINTS: 'complaints',
  SYNC_QUEUE: 'syncQueue',
  CONFLICTS: 'conflicts',
  SYNC_METADATA: 'syncMetadata',
  SETTINGS: 'settings'
};

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Auth store
      if (!db.objectStoreNames.contains(STORES.AUTH)) {
        db.createObjectStore(STORES.AUTH, { keyPath: 'key' });
      }

      // Projects store
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('status', 'status', { unique: false });
        projectStore.createIndex('createdBy', 'createdBy', { unique: false });
      }

      // Users store
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'uid' });
        userStore.createIndex('role', 'role', { unique: false });
        userStore.createIndex('email', 'email', { unique: true });
      }

      // Complaints store
      if (!db.objectStoreNames.contains(STORES.COMPLAINTS)) {
        const complaintStore = db.createObjectStore(STORES.COMPLAINTS, { keyPath: 'id' });
        complaintStore.createIndex('status', 'status', { unique: false });
        complaintStore.createIndex('submittedBy', 'submittedBy', { unique: false });
      }

      // Enhanced sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        console.log('Creating sync queue store with indexes...');
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('priority', 'priority', { unique: false });
        syncStore.createIndex('userId', 'userId', { unique: false });
        console.log('Sync queue store created with all indexes');
      } else {
        // If store exists, check if it has all required indexes
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const existingStore = transaction.objectStore(STORES.SYNC_QUEUE);
          const requiredIndexes = ['timestamp', 'type', 'status', 'priority', 'userId'];

          requiredIndexes.forEach(indexName => {
            try {
              existingStore.index(indexName);
            } catch (error) {
              console.log(`Creating missing index: ${indexName}`);
              existingStore.createIndex(indexName, indexName, { unique: false });
            }
          });
        }
      }

      // Conflicts store
      if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
        const conflictsStore = db.createObjectStore(STORES.CONFLICTS, { keyPath: 'id' });
        conflictsStore.createIndex('entityId', 'entityId', { unique: false });
        conflictsStore.createIndex('timestamp', 'timestamp', { unique: false });
        conflictsStore.createIndex('status', 'status', { unique: false });
      }

      // Sync metadata store
      if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
        db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'entityType' });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
};

// Reset database (useful for development and fixing schema issues)
export const resetDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onsuccess = () => {
      console.log('Database reset successfully');
      resolve();
    };
    deleteRequest.onblocked = () => {
      console.warn('Database deletion blocked - close all tabs and try again');
      resolve(); // Don't reject, just warn
    };
  });
};

// Check if database needs upgrade by testing for required indexes
const checkDatabaseIntegrity = async (): Promise<boolean> => {
  try {
    const db = await initDB();

    // Test if sync queue has the required status index
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    try {
      // Try to access the status index
      store.index('status');
      db.close();
      return true; // Database is properly set up
    } catch (indexError) {
      console.warn('Database missing required indexes:', indexError);
      db.close();
      return false; // Database needs to be recreated
    }
  } catch (error) {
    console.warn('Database integrity check failed:', error);
    return false;
  }
};

// Initialize database with error handling and migration
export const initializeOfflineStorage = async (): Promise<void> => {
  try {
    // First, check if the database has the correct schema
    const isIntegrityOk = await checkDatabaseIntegrity();

    if (!isIntegrityOk) {
      console.log('Database schema outdated, forcing recreation...');
      await resetDatabase();
      // Wait a bit for the deletion to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await initDB();
    console.log('Offline storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline storage:', error);

    // If initialization fails, try to reset and reinitialize
    console.log('Attempting to reset database and reinitialize...');
    try {
      await resetDatabase();
      // Wait a bit for the deletion to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      await initDB();
      console.log('Database reset and reinitialized successfully');
    } catch (resetError) {
      console.error('Failed to reset database:', resetError);
      throw resetError;
    }
  }
};

// Alias for backward compatibility
export { initializeOfflineStorage as initOfflineStorage };

// Generic database operations
const performDBOperation = async <T>(
  storeName: string,
  operation: (store: IDBObjectStore) => IDBRequest,
  mode: IDBTransactionMode = 'readonly'
): Promise<T> => {
  const db = await initDB();
  const transaction = db.transaction([storeName], mode);
  const store = transaction.objectStore(storeName);
  const request = operation(store);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Auth persistence
export const saveAuthData = async (user: AppUser): Promise<void> => {
  await performDBOperation(
    STORES.AUTH,
    (store) => store.put({ key: 'currentUser', data: user }),
    'readwrite'
  );
};

export const getAuthData = async (): Promise<AppUser | null> => {
  try {
    const result = await performDBOperation<any>(
      STORES.AUTH,
      (store) => store.get('currentUser')
    );
    return result?.data || null;
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
};

export const clearAuthData = async (): Promise<void> => {
  await performDBOperation(
    STORES.AUTH,
    (store) => store.delete('currentUser'),
    'readwrite'
  );
};

// Project operations
export const saveProject = async (project: Project): Promise<void> => {
  await performDBOperation(
    STORES.PROJECTS,
    (store) => store.put(project),
    'readwrite'
  );
};

export const getProject = async (id: string): Promise<Project | null> => {
  try {
    const result = await performDBOperation<Project>(
      STORES.PROJECTS,
      (store) => store.get(id)
    );
    return result || null;
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
};

export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const result = await performDBOperation<Project[]>(
      STORES.PROJECTS,
      (store) => store.getAll()
    );
    return result || [];
  } catch (error) {
    console.error('Error getting all projects:', error);
    return [];
  }
};

export const getProjectsByStatus = async (status: string): Promise<Project[]> => {
  try {
    const result = await performDBOperation<Project[]>(
      STORES.PROJECTS,
      (store) => store.index('status').getAll(status)
    );
    return result || [];
  } catch (error) {
    console.error('Error getting projects by status:', error);
    return [];
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  await performDBOperation(
    STORES.PROJECTS,
    (store) => store.delete(id),
    'readwrite'
  );
};

// User operations
export const saveUser = async (user: AppUser): Promise<void> => {
  await performDBOperation(
    STORES.USERS,
    (store) => store.put(user),
    'readwrite'
  );
};

export const getUser = async (uid: string): Promise<AppUser | null> => {
  try {
    const result = await performDBOperation<AppUser>(
      STORES.USERS,
      (store) => store.get(uid)
    );
    return result || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    const result = await performDBOperation<AppUser[]>(
      STORES.USERS,
      (store) => store.getAll()
    );
    return result || [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export const deleteUser = async (uid: string): Promise<void> => {
  await performDBOperation(
    STORES.USERS,
    (store) => store.delete(uid),
    'readwrite'
  );
};

// Enhanced sync queue operations
interface SyncQueueItem {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  lastError?: string;
  userId: string;
  priority: 'low' | 'medium' | 'high';
  conflictResolution?: 'client-wins' | 'server-wins' | 'merge' | 'manual';
}

// Conflict resolution interface
interface DataConflict {
  id: string;
  entityType: string;
  entityId: string;
  clientData: any;
  serverData: any;
  timestamp: number;
  userId: string;
  status: 'pending' | 'resolved';
  resolution?: 'client-wins' | 'server-wins' | 'merged';
  resolvedData?: any;
}

// Sync metadata for tracking
interface SyncMetadata {
  entityType: string;
  lastSyncTimestamp: number;
  syncInProgress: boolean;
  conflictCount: number;
  pendingActionsCount: number;
}

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> => {
  const syncItem: Omit<SyncQueueItem, 'id'> = {
    ...item,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
    priority: item.priority || 'medium'
  };

  await performDBOperation(
    STORES.SYNC_QUEUE,
    (store) => store.add(syncItem),
    'readwrite'
  );

  // Trigger background sync if available
  triggerBackgroundSync();
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  try {
    const result = await performDBOperation<SyncQueueItem[]>(
      STORES.SYNC_QUEUE,
      (store) => store.getAll()
    );
    return result || [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

export const removeSyncQueueItem = async (id: number): Promise<void> => {
  await performDBOperation(
    STORES.SYNC_QUEUE,
    (store) => store.delete(id),
    'readwrite'
  );
};

export const updateSyncQueueItem = async (item: SyncQueueItem): Promise<void> => {
  await performDBOperation(
    STORES.SYNC_QUEUE,
    (store) => store.put(item),
    'readwrite'
  );
};

// Settings operations
export const saveSetting = async (key: string, value: any): Promise<void> => {
  await performDBOperation(
    STORES.SETTINGS,
    (store) => store.put({ key, value }),
    'readwrite'
  );
};

export const getSetting = async (key: string): Promise<any> => {
  try {
    const result = await performDBOperation<any>(
      STORES.SETTINGS,
      (store) => store.get(key)
    );
    return result?.value || null;
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
};

// Network status
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Trigger background sync
const triggerBackgroundSync = (): void => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      // Type assertion for background sync
      return (registration as any).sync?.register('background-sync');
    }).catch(error => {
      console.warn('Background sync registration failed:', error);
    });
  }
};

// Conflict resolution functions
export const saveConflict = async (conflict: Omit<DataConflict, 'id'>): Promise<string> => {
  const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const fullConflict: DataConflict = {
    ...conflict,
    id: conflictId
  };

  await performDBOperation(
    STORES.CONFLICTS,
    (store) => store.add(fullConflict),
    'readwrite'
  );

  return conflictId;
};

export const getConflicts = async (): Promise<DataConflict[]> => {
  try {
    const result = await performDBOperation<DataConflict[]>(
      STORES.CONFLICTS,
      (store) => store.getAll()
    );
    return result || [];
  } catch (error) {
    console.error('Error getting conflicts:', error);
    return [];
  }
};

export const resolveConflict = async (conflictId: string, resolution: DataConflict['resolution'], resolvedData?: any): Promise<void> => {
  await performDBOperation(
    STORES.CONFLICTS,
    (store) => {
      const getRequest = store.get(conflictId);
      getRequest.onsuccess = () => {
        const conflict = getRequest.result;
        if (conflict) {
          conflict.status = 'resolved';
          conflict.resolution = resolution;
          conflict.resolvedData = resolvedData;
          store.put(conflict);
        }
      };
      return getRequest;
    },
    'readwrite'
  );
};

// Sync metadata functions
export const updateSyncMetadata = async (entityType: string, metadata: Partial<SyncMetadata>): Promise<void> => {
  await performDBOperation(
    STORES.SYNC_METADATA,
    (store) => {
      const getRequest = store.get(entityType);
      getRequest.onsuccess = () => {
        const existing = getRequest.result || { entityType, lastSyncTimestamp: 0, syncInProgress: false, conflictCount: 0, pendingActionsCount: 0 };
        const updated = { ...existing, ...metadata };
        store.put(updated);
      };
      return getRequest;
    },
    'readwrite'
  );
};

export const getSyncMetadata = async (entityType: string): Promise<SyncMetadata | null> => {
  try {
    const result = await performDBOperation<SyncMetadata>(
      STORES.SYNC_METADATA,
      (store) => store.get(entityType)
    );
    return result || null;
  } catch (error) {
    console.error('Error getting sync metadata:', error);
    return null;
  }
};

// Get pending actions count
export const getPendingActionsCount = async (): Promise<number> => {
  try {
    const result = await performDBOperation<SyncQueueItem[]>(
      STORES.SYNC_QUEUE,
      (store) => store.index('status').getAll('pending')
    );
    return result?.length || 0;
  } catch (error) {
    console.error('Error getting pending actions count:', error);
    return 0;
  }
};

// Get failed actions
export const getFailedActions = async (): Promise<SyncQueueItem[]> => {
  try {
    const result = await performDBOperation<SyncQueueItem[]>(
      STORES.SYNC_QUEUE,
      (store) => store.index('status').getAll('failed')
    );
    return result || [];
  } catch (error) {
    console.error('Error getting failed actions:', error);
    return [];
  }
};

// Retry failed actions
export const retryFailedActions = async (): Promise<void> => {
  const failedActions = await getFailedActions();

  for (const action of failedActions) {
    if (action.retryCount < 3) {
      action.status = 'pending';
      action.retryCount++;
      await updateSyncQueueItem(action);
    }
  }

  triggerBackgroundSync();
};

// Initialize offline storage
// Force database recreation (for debugging IndexedDB issues)
export const forceRecreateDatabase = async (): Promise<void> => {
  console.log('🔄 Forcing database recreation...');

  try {
    // Close any existing connections
    // Note: dbInstance would need to be declared globally if used

    // Delete the database
    await resetDatabase();

    // Wait for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Recreate the database
    await initDB();

    console.log('✅ Database recreated successfully');
  } catch (error) {
    console.error('❌ Failed to recreate database:', error);
    throw error;
  }
};

// Export for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).forceRecreateDatabase = forceRecreateDatabase;
  (window as any).resetDatabase = resetDatabase;
  (window as any).initializeOfflineStorage = initializeOfflineStorage;
}
