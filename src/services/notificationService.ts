import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserNotification {
  id?: string;
  userId: string;
  type: 'project_deleted' | 'project_updated' | 'milestone_updated' | 'system_message';
  projectId?: string;
  milestoneId?: string;
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

class NotificationService {
  // Create a new notification
  async createNotification(notification: Omit<UserNotification, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'user_notifications'), {
        ...notification,
        timestamp: serverTimestamp()
      });
      console.log('Notification created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a specific user
  async getUserNotifications(userId: string, limit: number = 50): Promise<UserNotification[]> {
    try {
      const q = query(
        collection(db, 'user_notifications'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const notifications: UserNotification[] = [];
      
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() } as UserNotification);
      });
      
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'user_notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'user_notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = [];
      
      snapshot.forEach(doc => {
        batch.push(updateDoc(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        }));
      });
      
      await Promise.all(batch);
      console.log(`Marked ${batch.length} notifications as read for user ${userId}`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'user_notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications for a user
  subscribeToUserNotifications(
    userId: string,
    callback: (notifications: UserNotification[]) => void
  ): () => void {
    const q = query(
      collection(db, 'user_notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: UserNotification[] = [];
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() } as UserNotification);
      });
      callback(notifications);
    });
    
    return unsubscribe;
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'user_notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Notify users about project deletion
  async notifyProjectDeletion(projectId: string, projectName: string, affectedUserIds: string[]): Promise<void> {
    try {
      const notifications = affectedUserIds.map(userId => ({
        userId,
        type: 'project_deleted' as const,
        projectId,
        title: 'Project Deleted',
        message: `The project "${projectName}" you were working on has been deleted.`,
        read: false,
        priority: 'high' as const
      }));

      const promises = notifications.map(notification => this.createNotification(notification));
      await Promise.all(promises);
      
      console.log(`Sent project deletion notifications to ${affectedUserIds.length} users`);
    } catch (error) {
      console.error('Error notifying project deletion:', error);
      throw error;
    }
  }

  // Clean up old notifications (older than 30 days)
  async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'user_notifications'),
        where('timestamp', '<', thirtyDaysAgo)
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${snapshot.docs.length} old notifications`);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
