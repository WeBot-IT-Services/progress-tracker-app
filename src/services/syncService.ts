// Sync Service for offline/online data synchronization
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  addToSyncQueue,
  saveProject,
  saveUser,
  getProject,
  deleteProject as deleteProjectFromStorage,
  isOnline,
  saveConflict,
  getConflicts,
  resolveConflict,
  updateSyncMetadata,
  getSyncMetadata,
  getPendingActionsCount,
  getFailedActions,
  retryFailedActions,
  initializeOfflineStorage
} from './offlineStorage';
import type { Project, User as AppUser } from '../types';

// Enhanced sync status
let isSyncing = false;
let syncListeners: ((status: SyncStatus) => void)[] = [];
let networkListeners: ((online: boolean) => void)[] = [];

// Sync status interface
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

// Current sync status
let currentSyncStatus: SyncStatus = {
  isSyncing: false,
  isOnline: navigator.onLine,
  pendingActions: 0,
  failedActions: 0,
  conflicts: 0,
  lastSyncTime: null,
  syncProgress: 0
};

// Initialize sync service
export const initSyncService = async () => {
  try {
    // Initialize offline storage first
    await initializeOfflineStorage();

    // Listen for network changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Don't start periodic sync immediately - wait for authentication
    // Periodic sync will be started when user logs in

    if (import.meta.env.DEV) {
      console.log('Sync service initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize sync service:', error);
    throw error;
  }
};

// Start sync after authentication
export const startSyncAfterAuth = () => {
  if (isOnline() && auth.currentUser) {
    if (import.meta.env.DEV) {
      console.log('Starting sync after authentication');
    }
    startPeriodicSync();
    startSync();
  }
};

// Handle network online
const handleOnline = async () => {
  console.log('Network is online - starting sync');
  await updateSyncStatus({ isOnline: true });
  networkListeners.forEach(listener => listener(true));
  startSync();
  startPeriodicSync();
};

// Handle network offline
const handleOffline = async () => {
  console.log('Network is offline');
  await updateSyncStatus({ isOnline: false, isSyncing: false });
  networkListeners.forEach(listener => listener(false));
  stopPeriodicSync();
};

// Add network status listener
export const addNetworkListener = (listener: (online: boolean) => void) => {
  networkListeners.push(listener);
  return () => {
    networkListeners = networkListeners.filter(l => l !== listener);
  };
};

// Add sync status listener
export const addSyncListener = (listener: (status: SyncStatus) => void) => {
  syncListeners.push(listener);
  // Immediately call with current status
  listener(currentSyncStatus);
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
};

// Update sync status and notify listeners
const updateSyncStatus = async (updates: Partial<SyncStatus>) => {
  currentSyncStatus = { ...currentSyncStatus, ...updates };

  // Update counts from database
  if (!updates.pendingActions) {
    currentSyncStatus.pendingActions = await getPendingActionsCount();
  }
  if (!updates.failedActions) {
    const failedActions = await getFailedActions();
    currentSyncStatus.failedActions = failedActions.length;
  }
  if (!updates.conflicts) {
    const conflicts = await getConflicts();
    currentSyncStatus.conflicts = conflicts.filter(c => c.status === 'pending').length;
  }

  syncListeners.forEach(listener => listener(currentSyncStatus));
};

// Periodic sync interval
let syncInterval: NodeJS.Timeout | null = null;

const startPeriodicSync = () => {
  if (syncInterval) return;
  
  // Sync every 30 seconds when online
  syncInterval = setInterval(() => {
    if (isOnline() && !isSyncing) {
      startSync();
    }
  }, 30000);
};

const stopPeriodicSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

// Main sync function with enhanced status tracking
export const startSync = async (): Promise<void> => {
  if (isSyncing || !isOnline()) {
    return;
  }

  isSyncing = true;
  await updateSyncStatus({
    isSyncing: true,
    syncProgress: 0,
    currentOperation: 'Starting sync...'
  });

  try {
    // Sync pending operations first
    await updateSyncStatus({ syncProgress: 25, currentOperation: 'Syncing pending operations...' });
    await syncPendingOperations();

    // Then sync data from server
    await updateSyncStatus({ syncProgress: 50, currentOperation: 'Syncing from server...' });
    await syncFromServer();

    // Process conflicts
    await updateSyncStatus({ syncProgress: 75, currentOperation: 'Processing conflicts...' });
    await processConflicts();

    await updateSyncStatus({
      syncProgress: 100,
      currentOperation: 'Sync completed',
      lastSyncTime: new Date()
    });

    if (import.meta.env.DEV) {
      console.log('Sync completed successfully');
    }
  } catch (error) {
    console.error('Sync failed:', error);
    await updateSyncStatus({
      currentOperation: `Sync failed: ${error.message}`,
      syncProgress: 0
    });
  } finally {
    isSyncing = false;
    await updateSyncStatus({ isSyncing: false, currentOperation: undefined });
  }
};

// Sync pending operations to server with conflict detection
const syncPendingOperations = async (): Promise<void> => {
  const syncQueue = await getSyncQueue();
  const pendingItems = syncQueue.filter(item => item.status === 'pending');

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];

    try {
      // Update item status to syncing
      item.status = 'syncing';
      await updateSyncQueueItem(item);

      // Check for conflicts before processing
      const hasConflict = await checkForConflicts(item);

      if (hasConflict) {
        console.log('Conflict detected for item:', item.id);
        item.status = 'failed';
        item.lastError = 'Conflict detected - manual resolution required';
        await updateSyncQueueItem(item);
        continue;
      }

      await processSyncItem(item);

      // Mark as completed and remove
      item.status = 'completed';
      await updateSyncQueueItem(item);
      await removeSyncQueueItem(item.id!);

    } catch (error) {
      console.error('Failed to sync item:', item, error);

      // Update item with error status
      item.status = 'failed';
      item.retryCount++;
      item.lastError = error.message;

      // Remove item if too many retries
      if (item.retryCount >= 3) {
        console.warn('Removing item after 3 failed attempts:', item);
        await removeSyncQueueItem(item.id!);
      } else {
        await updateSyncQueueItem(item);
      }
    }

    // Update progress
    const progress = 25 + (i / pendingItems.length) * 25;
    await updateSyncStatus({ syncProgress: progress });
  }
};

// Process individual sync item
const processSyncItem = async (item: any): Promise<void> => {
  const { type, collection: collectionName, data } = item;

  switch (type) {
    case 'CREATE':
      if (collectionName === 'projects') {
        await addDoc(collection(db, 'projects'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (collectionName === 'users') {
        await addDoc(collection(db, 'users'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      break;

    case 'UPDATE':
      if (collectionName === 'projects') {
        await updateDoc(doc(db, 'projects', data.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else if (collectionName === 'users') {
        await updateDoc(doc(db, 'users', data.uid), {
          ...data,
          updatedAt: serverTimestamp()
        });
      }
      break;

    case 'DELETE':
      if (collectionName === 'projects') {
        await deleteDoc(doc(db, 'projects', data.id));
      } else if (collectionName === 'users') {
        await deleteDoc(doc(db, 'users', data.uid));
      }
      break;

    default:
      throw new Error(`Unknown sync operation type: ${type}`);
  }
};

// Sync data from server to local storage
const syncFromServer = async (): Promise<void> => {
  try {
    // Sync projects
    const projectsSnapshot = await getDocs(
      query(collection(db, 'projects'), orderBy('updatedAt', 'desc'))
    );
    
    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();
      const project: Project = {
        id: doc.id,
        projectName: projectData.projectName,
        amount: projectData.amount,
        estimatedCompletionDate: projectData.estimatedCompletionDate?.toDate() || new Date(),
        status: projectData.status,
        createdBy: projectData.createdBy,
        createdAt: projectData.createdAt?.toDate() || new Date(),
        updatedAt: projectData.updatedAt?.toDate() || new Date(),
        salesData: projectData.salesData,
        designData: projectData.designData,
        productionData: projectData.productionData,
        installationData: projectData.installationData
      };
      
      await saveProject(project);
    }

    // Sync users
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), orderBy('updatedAt', 'desc'))
    );
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      // Skip if email is missing or invalid
      if (!userData.email) continue;
      const user: AppUser = {
        employeeId: userData.employeeId || `EMP${Date.now()}`,
        uid: doc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        passwordSet: userData.passwordSet ?? true,
        isTemporary: userData.isTemporary ?? false
      };
      
      try {
        await saveUser(user);
      } catch (e: any) {
        // Ignore duplicate key errors for email index
        if (e.name !== 'ConstraintError') {
          throw e;
        }
      }
    }

  } catch (error) {
    console.error('Error syncing from server:', error);
    throw error;
  }
};

// Setup real-time listeners when online and authenticated
export const setupRealtimeListeners = (): (() => void)[] => {
  const unsubscribers: (() => void)[] = [];

  if (!isOnline()) {
    console.log('Skipping realtime listeners - offline');
    return unsubscribers;
  }

  // Check if user is authenticated
  if (!auth.currentUser) {
    console.log('Skipping realtime listeners - not authenticated');
    return unsubscribers;
  }

  try {
    // Listen to projects changes
    const projectsUnsubscribe = onSnapshot(
      query(collection(db, 'projects'), orderBy('updatedAt', 'desc')),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const doc = change.doc;
            const projectData = doc.data();
            const project: Project = {
              id: doc.id,
              projectName: projectData.projectName,
              amount: projectData.amount,
              estimatedCompletionDate: projectData.estimatedCompletionDate?.toDate() || new Date(),
              status: projectData.status,
              createdBy: projectData.createdBy,
              createdAt: projectData.createdAt?.toDate() || new Date(),
              updatedAt: projectData.updatedAt?.toDate() || new Date(),
              salesData: projectData.salesData,
              designData: projectData.designData,
              productionData: projectData.productionData,
              installationData: projectData.installationData
            };
            
            await saveProject(project);
          }
        });
      },
      (error) => {
        console.warn('Projects listener error (this is normal if not authenticated):', error.code);
        // Don't throw error, just log it
      }
    );

    // Listen to users changes
    const usersUnsubscribe = onSnapshot(
      query(collection(db, 'users'), orderBy('updatedAt', 'desc')),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const doc = change.doc;
            const userData = doc.data();
            // Skip if email is missing or invalid
            if (!userData.email) return;
            const user: AppUser = {
              employeeId: userData.employeeId || `EMP${Date.now()}`,
              uid: doc.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              department: userData.department,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              passwordSet: userData.passwordSet ?? true,
              isTemporary: userData.isTemporary ?? false
            };
            
            try {
              await saveUser(user);
            } catch (e: any) {
              // Ignore duplicate key errors for email index
              if (e.name !== 'ConstraintError') {
                throw e;
              }
            }
          }
        });
      },
      (error) => {
        console.warn('Users listener error (this is normal if not authenticated):', error.code);
        // Don't throw error, just log it
      }
    );

    unsubscribers.push(projectsUnsubscribe, usersUnsubscribe);
  } catch (error) {
    console.error('Error setting up realtime listeners:', error);
  }

  return unsubscribers;
};

// Offline-first operations
export const createProjectOffline = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newProject: Project = {
    ...project,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Save locally first
  await saveProject(newProject);

  // Add to sync queue
  await addToSyncQueue({
    type: 'CREATE',
    collection: 'projects',
    data: newProject,
    priority: 'medium',
    userId: newProject.createdBy || 'unknown'
  });

  return id;
};

export const updateProjectOffline = async (id: string, updates: Partial<Project>): Promise<void> => {
  // Get current project
  const currentProject = await getProject(id);
  if (!currentProject) {
    throw new Error('Project not found');
  }

  const updatedProject: Project = {
    ...currentProject,
    ...updates,
    updatedAt: new Date()
  };

  // Save locally first
  await saveProject(updatedProject);

  // Add to sync queue
  await addToSyncQueue({
    type: 'UPDATE',
    collection: 'projects',
    data: updatedProject,
    priority: 'medium',
    userId: updatedProject.createdBy || 'unknown'
  });
};

export const deleteProjectOffline = async (id: string): Promise<void> => {
  // Remove locally first
  await deleteProjectFromStorage(id);

  // Add to sync queue
  await addToSyncQueue({
    type: 'DELETE',
    collection: 'projects',
    data: { id },
    priority: 'medium',
    userId: 'unknown'
  });
};

// Conflict detection and resolution
const checkForConflicts = async (item: any): Promise<boolean> => {
  if (item.type !== 'UPDATE') return false;

  try {
    // Get current server data
    const serverDoc = await getDocs(
      query(collection(db, item.collection), orderBy('updatedAt', 'desc'))
    );

    const serverData = serverDoc.docs.find(doc => doc.id === item.data.id);
    if (!serverData) return false;

    const serverTimestamp = serverData.data().updatedAt?.toDate?.()?.getTime() || 0;
    const clientTimestamp = new Date(item.data.updatedAt).getTime();

    // If server data is newer, we have a conflict
    if (serverTimestamp > clientTimestamp) {
      await saveConflict({
        entityType: item.collection,
        entityId: item.data.id,
        clientData: item.data,
        serverData: serverData.data(),
        timestamp: Date.now(),
        userId: item.userId,
        status: 'pending'
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking for conflicts:', error);
    return false;
  }
};

const processConflicts = async (): Promise<void> => {
  const conflicts = await getConflicts();
  const pendingConflicts = conflicts.filter(c => c.status === 'pending');

  for (const conflict of pendingConflicts) {
    // Auto-resolve based on conflict resolution strategy
    const resolution = await autoResolveConflict(conflict);

    if (resolution) {
      await resolveConflict(conflict.id, resolution.strategy as 'client-wins' | 'server-wins' | 'merged', resolution.data);

      // Apply resolved data
      if (resolution.strategy !== 'server-wins') {
        await applyResolvedData(conflict.entityType, conflict.entityId, resolution.data);
      }
    }
  }
};

const autoResolveConflict = async (conflict: any): Promise<{ strategy: string; data: any } | null> => {
  // Simple auto-resolution strategies

  // Strategy 1: Last-write-wins (client wins if user is currently editing)
  if (conflict.conflictResolution === 'client-wins') {
    return { strategy: 'client-wins', data: conflict.clientData };
  }

  // Strategy 2: Server wins (default for most cases)
  if (conflict.conflictResolution === 'server-wins') {
    return { strategy: 'server-wins', data: conflict.serverData };
  }

  // Strategy 3: Merge non-conflicting fields
  if (conflict.conflictResolution === 'merge') {
    const mergedData = mergeData(conflict.clientData, conflict.serverData);
    return { strategy: 'merged', data: mergedData };
  }

  // Default: require manual resolution
  return null;
};

const mergeData = (clientData: any, serverData: any): any => {
  // Simple merge strategy - prefer client data for user-editable fields
  // and server data for system fields
  const merged = { ...serverData };

  // Fields that client changes should take precedence
  const clientPriorityFields = ['name', 'description', 'amount', 'notes'];

  clientPriorityFields.forEach(field => {
    if (clientData[field] !== undefined) {
      merged[field] = clientData[field];
    }
  });

  // Keep server timestamps
  merged.updatedAt = serverData.updatedAt;
  merged.createdAt = serverData.createdAt;

  return merged;
};

const applyResolvedData = async (entityType: string, entityId: string, data: any): Promise<void> => {
  // Apply resolved data to server
  try {
    await updateDoc(doc(db, entityType, entityId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error applying resolved data:', error);
  }
};

// Get enhanced sync status
export const getSyncStatus = (): SyncStatus => currentSyncStatus;

// Re-export conflict management functions
export { getConflicts, resolveConflict } from './offlineStorage';

// Force sync function
export const forceSync = async (): Promise<void> => {
  if (!isOnline()) {
    console.warn('Cannot force sync while offline');
    return;
  }

  await startSync();
};

// Re-export retry failed actions
export { retryFailedActions } from './offlineStorage';


