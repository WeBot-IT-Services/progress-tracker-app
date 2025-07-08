import { Timestamp } from 'firebase/firestore';

/**
 * Utility functions for safe date handling and formatting
 */

export interface DateValue {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

/**
 * Safely converts various date formats to a Date object
 */
export const safeToDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  try {
    // Handle Firestore Timestamp
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate();
    }
    
    // Handle objects with toDate method (Firestore Timestamp-like)
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    
    // Handle objects with seconds property (Firestore Timestamp data)
    if (dateValue && typeof dateValue.seconds === 'number') {
      return new Date(dateValue.seconds * 1000);
    }
    
    // Handle Date objects
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Handle number timestamps
    if (typeof dateValue === 'number') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  } catch (error) {
    console.warn('Error converting date:', dateValue, error);
    return null;
  }
};

/**
 * Safely formats a date value to a localized date string
 */
export const safeFormatDate = (
  dateValue: any, 
  fallback: string = 'Not set',
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = safeToDate(dateValue);
  if (!date) return fallback;
  
  try {
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return fallback;
  }
};

/**
 * Safely formats a date value to a localized date and time string
 */
export const safeFormatDateTime = (
  dateValue: any, 
  fallback: string = 'Not set'
): string => {
  const date = safeToDate(dateValue);
  if (!date) return fallback;
  
  try {
    return date.toLocaleString();
  } catch (error) {
    console.warn('Error formatting datetime:', date, error);
    return fallback;
  }
};

/**
 * Safely formats a date value to ISO string
 */
export const safeFormatISO = (dateValue: any): string | null => {
  const date = safeToDate(dateValue);
  if (!date) return null;
  
  try {
    return date.toISOString();
  } catch (error) {
    console.warn('Error formatting ISO date:', date, error);
    return null;
  }
};

/**
 * Check if a date value is valid
 */
export const isValidDate = (dateValue: any): boolean => {
  return safeToDate(dateValue) !== null;
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export const getRelativeTime = (dateValue: any, fallback: string = 'Unknown'): string => {
  const date = safeToDate(dateValue);
  if (!date) return fallback;
  
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (Math.abs(diffDays) >= 1) {
      return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` : `in ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else if (Math.abs(diffHours) >= 1) {
      return diffHours > 0 ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` : `in ${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''}`;
    } else if (Math.abs(diffMinutes) >= 1) {
      return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : `in ${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? 's' : ''}`;
    } else {
      return 'Just now';
    }
  } catch (error) {
    console.warn('Error calculating relative time:', date, error);
    return fallback;
  }
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (dateValue: any): boolean => {
  const date = safeToDate(dateValue);
  if (!date) return false;
  
  return date.getTime() < new Date().getTime();
};

/**
 * Format date for display in cards/lists
 */
export const formatDisplayDate = (dateValue: any, label: string = 'Date'): string => {
  return `${label}: ${safeFormatDate(dateValue)}`;
};

/**
 * Format completion date specifically
 */
export const formatCompletionDate = (dateValue: any): string => {
  return formatDisplayDate(dateValue, 'Completed');
};

/**
 * Format due date specifically
 */
export const formatDueDate = (dateValue: any): string => {
  return formatDisplayDate(dateValue, 'Due');
};

/**
 * Validate and clean date for storage
 */
export const cleanDateForStorage = (dateValue: any): Date | null => {
  const date = safeToDate(dateValue);
  return date;
};
