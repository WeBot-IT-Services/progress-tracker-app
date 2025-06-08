// Offline Storage Service using IndexedDB
import type { User as AppUser, Project } from '../types';

// IndexedDB configuration
const DB_NAME = 'ProgressTrackerDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  AUTH: 'auth',
  PROJECTS: 'projects',
  USERS: 'users',
  COMPLAINTS: 'complaints',
  SYNC_QUEUE: 'syncQueue',
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

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
};

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

// Sync queue operations
interface SyncQueueItem {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> => {
  const syncItem: Omit<SyncQueueItem, 'id'> = {
    ...item,
    timestamp: Date.now(),
    retryCount: 0
  };

  await performDBOperation(
    STORES.SYNC_QUEUE,
    (store) => store.add(syncItem),
    'readwrite'
  );
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

// Initialize offline storage
export const initOfflineStorage = async (): Promise<void> => {
  try {
    await initDB();
    console.log('Offline storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline storage:', error);
  }
};
