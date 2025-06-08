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
  isOnline
} from './offlineStorage';
import type { Project, User as AppUser } from '../types';

// Sync status
let isSyncing = false;
let syncListeners: (() => void)[] = [];

// Network status listeners
let networkListeners: ((online: boolean) => void)[] = [];

// Initialize sync service
export const initSyncService = () => {
  // Listen for network changes
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Don't start periodic sync immediately - wait for authentication
  // Periodic sync will be started when user logs in

  console.log('Sync service initialized');
};

// Start sync after authentication
export const startSyncAfterAuth = () => {
  if (isOnline() && auth.currentUser) {
    console.log('Starting sync after authentication');
    startPeriodicSync();
    startSync();
  }
};

// Handle network online
const handleOnline = () => {
  console.log('Network is online - starting sync');
  networkListeners.forEach(listener => listener(true));
  startSync();
  startPeriodicSync();
};

// Handle network offline
const handleOffline = () => {
  console.log('Network is offline');
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
export const addSyncListener = (listener: () => void) => {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
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

// Main sync function
export const startSync = async (): Promise<void> => {
  if (isSyncing || !isOnline()) {
    return;
  }

  isSyncing = true;
  console.log('Starting sync...');

  try {
    // Sync pending operations first
    await syncPendingOperations();
    
    // Then sync data from server
    await syncFromServer();
    
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    isSyncing = false;
    syncListeners.forEach(listener => listener());
  }
};

// Sync pending operations to server
const syncPendingOperations = async (): Promise<void> => {
  const syncQueue = await getSyncQueue();
  
  for (const item of syncQueue) {
    try {
      await processSyncItem(item);
      await removeSyncQueueItem(item.id!);
    } catch (error) {
      console.error('Failed to sync item:', item, error);
      
      // Increment retry count
      item.retryCount++;
      
      // Remove item if too many retries
      if (item.retryCount >= 3) {
        console.warn('Removing item after 3 failed attempts:', item);
        await removeSyncQueueItem(item.id!);
      } else {
        await updateSyncQueueItem(item);
      }
    }
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
      const user: AppUser = {
        uid: doc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date()
      };
      
      await saveUser(user);
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
            const user: AppUser = {
              uid: doc.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              department: userData.department,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date()
            };
            
            await saveUser(user);
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
    data: newProject
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
    data: updatedProject
  });
};

export const deleteProjectOffline = async (id: string): Promise<void> => {
  // Remove locally first
  await deleteProjectFromStorage(id);

  // Add to sync queue
  await addToSyncQueue({
    type: 'DELETE',
    collection: 'projects',
    data: { id }
  });
};

// Get sync status
export const getSyncStatus = () => ({
  isSyncing,
  isOnline: isOnline(),
  lastSyncTime: new Date() // You can store this in IndexedDB
});

// Force sync
export const forceSync = async (): Promise<void> => {
  if (isOnline()) {
    await startSync();
  } else {
    throw new Error('Cannot sync while offline');
  }
};
