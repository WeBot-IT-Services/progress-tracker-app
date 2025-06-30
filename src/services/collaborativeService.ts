import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from 'firebase/auth';

export interface DocumentLock {
  id: string;
  documentId: string;
  documentType: 'project' | 'milestone';
  userId: string;
  userEmail: string;
  userName: string;
  lockedAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
}

export interface UserPresence {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  documentId: string;
  documentType: 'project' | 'milestone';
  action: 'viewing' | 'editing';
  lastSeen: Timestamp;
  isOnline: boolean;
}

export interface CollaborativeState {
  locks: DocumentLock[];
  presence: UserPresence[];
  listeners: (() => void)[];
}

class CollaborativeService {
  private state: CollaborativeState = {
    locks: [],
    presence: [],
    listeners: []
  };

  private lockTimeout = 5 * 60 * 1000; // 5 minutes
  private presenceTimeout = 30 * 1000; // 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Document Locking Methods
  async acquireLock(
    documentId: string, 
    documentType: 'project' | 'milestone', 
    user: User
  ): Promise<{ success: boolean; lock?: DocumentLock; error?: string }> {
    try {
      const lockId = `${documentType}_${documentId}`;
      const lockRef = doc(db, 'document_locks', lockId);
      
      const result = await runTransaction(db, async (transaction) => {
        const lockDoc = await transaction.get(lockRef);
        
        // Check if lock exists and is still valid
        if (lockDoc.exists()) {
          const existingLock = lockDoc.data() as DocumentLock;
          const now = new Date();
          const expiresAt = existingLock.expiresAt.toDate();
          
          // If lock is expired, we can acquire it
          if (expiresAt > now && existingLock.userId !== user.uid) {
            return {
              success: false,
              error: `Document is currently being edited by ${existingLock.userName}`,
              existingLock
            };
          }
        }
        
        // Create or update the lock
        const newLock: DocumentLock = {
          id: lockId,
          documentId,
          documentType,
          userId: user.uid,
          userEmail: user.email || '',
          userName: user.displayName || user.email || 'Unknown User',
          lockedAt: serverTimestamp() as Timestamp,
          expiresAt: new Timestamp(
            Math.floor((Date.now() + this.lockTimeout) / 1000), 
            0
          ),
          isActive: true
        };
        
        transaction.set(lockRef, newLock);
        return { success: true, lock: newLock };
      });
      
      if (result.success && result.lock) {
        // Start heartbeat to keep lock alive
        this.startLockHeartbeat(lockId, user);
        return { success: true, lock: result.lock };
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to acquire lock'
        };
      }
    } catch (error) {
      console.error('Error acquiring lock:', error);

      // Handle specific Firebase permission errors
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'permission-denied') {
          return {
            success: false,
            error: 'Insufficient permissions for collaborative editing. Please check your access rights.'
          };
        } else if (error.code === 'unavailable') {
          return {
            success: false,
            error: 'Collaborative editing service temporarily unavailable. Please try again.'
          };
        }
      }

      return {
        success: false,
        error: 'Failed to acquire document lock. Please try again.'
      };
    }
  }

  async releaseLock(
    documentId: string, 
    documentType: 'project' | 'milestone', 
    userId: string
  ): Promise<boolean> {
    try {
      const lockId = `${documentType}_${documentId}`;
      const lockRef = doc(db, 'document_locks', lockId);
      
      await runTransaction(db, async (transaction) => {
        const lockDoc = await transaction.get(lockRef);
        
        if (lockDoc.exists()) {
          const lock = lockDoc.data() as DocumentLock;
          // Only allow the lock owner to release it
          if (lock.userId === userId) {
            transaction.delete(lockRef);
          }
        }
      });
      
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      return true;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  }

  private startLockHeartbeat(lockId: string, _user: User) {
    // Clear existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Update lock expiration every minute
    this.heartbeatInterval = setInterval(async () => {
      try {
        const lockRef = doc(db, 'document_locks', lockId);
        await setDoc(lockRef, {
          expiresAt: new Timestamp(
            Math.floor((Date.now() + this.lockTimeout) / 1000), 
            0
          ),
          lastHeartbeat: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating lock heartbeat:', error);
        // Stop heartbeat on error
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
      }
    }, 60000); // Every minute
  }

  // User Presence Methods
  async updatePresence(
    documentId: string,
    documentType: 'project' | 'milestone',
    action: 'viewing' | 'editing',
    user: User
  ): Promise<void> {
    try {
      const presenceId = `${user.uid}_${documentType}_${documentId}`;
      const presenceRef = doc(db, 'user_presence', presenceId);
      
      const presence: UserPresence = {
        id: presenceId,
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email || 'Unknown User',
        documentId,
        documentType,
        action,
        lastSeen: serverTimestamp() as Timestamp,
        isOnline: true
      };
      
      await setDoc(presenceRef, presence);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  async removePresence(
    documentId: string,
    documentType: 'project' | 'milestone',
    userId: string
  ): Promise<void> {
    try {
      const presenceId = `${userId}_${documentType}_${documentId}`;
      const presenceRef = doc(db, 'user_presence', presenceId);
      await deleteDoc(presenceRef);
    } catch (error) {
      console.error('Error removing presence:', error);
    }
  }

  // Real-time Listeners
  subscribeToLocks(
    documentId: string,
    documentType: 'project' | 'milestone',
    callback: (locks: DocumentLock[]) => void
  ): () => void {
    const q = query(
      collection(db, 'document_locks'),
      where('documentId', '==', documentId),
      where('documentType', '==', documentType)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locks: DocumentLock[] = [];
      snapshot.forEach((doc) => {
        locks.push({ id: doc.id, ...doc.data() } as DocumentLock);
      });
      callback(locks);
    });
    
    this.state.listeners.push(unsubscribe);
    return unsubscribe;
  }

  subscribeToPresence(
    documentId: string,
    documentType: 'project' | 'milestone',
    callback: (presence: UserPresence[]) => void
  ): () => void {
    const q = query(
      collection(db, 'user_presence'),
      where('documentId', '==', documentId),
      where('documentType', '==', documentType)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const presence: UserPresence[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as UserPresence;
        // Filter out stale presence (older than 30 seconds)
        const lastSeen = data.lastSeen.toDate();
        const now = new Date();
        if (now.getTime() - lastSeen.getTime() < this.presenceTimeout) {
          presence.push({ ...data, id: doc.id });
        }
      });
      callback(presence);
    });
    
    this.state.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Cleanup method
  cleanup(): void {
    // Clear all listeners
    this.state.listeners.forEach(unsubscribe => unsubscribe());
    this.state.listeners = [];
    
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Check if document is locked by another user
  async isDocumentLocked(
    documentId: string,
    documentType: 'project' | 'milestone',
    currentUserId: string
  ): Promise<{ isLocked: boolean; lock?: DocumentLock }> {
    try {
      const lockId = `${documentType}_${documentId}`;
      const q = query(
        collection(db, 'document_locks'),
        where('id', '==', lockId)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const lockData = snapshot.docs[0].data() as DocumentLock;
        const now = new Date();
        const expiresAt = lockData.expiresAt.toDate();
        
        // Check if lock is still valid and not owned by current user
        if (expiresAt > now && lockData.userId !== currentUserId) {
          return { isLocked: true, lock: lockData };
        }
      }
      
      return { isLocked: false };
    } catch (error) {
      console.error('Error checking document lock:', error);
      return { isLocked: false };
    }
  }
}

export const collaborativeService = new CollaborativeService();
