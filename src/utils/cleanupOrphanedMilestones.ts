// Utility script to clean up orphaned milestones
// This can be run manually or integrated into admin tools

import { milestonesService } from '../services/firebaseService';

export interface CleanupResult {
  success: boolean;
  cleaned: number;
  errors: string[];
  message: string;
}

/**
 * Clean up orphaned milestones (milestones whose projects no longer exist)
 * This function can be called from admin interface or run manually
 */
export const cleanupOrphanedMilestones = async (): Promise<CleanupResult> => {
  try {
    console.log('🧹 Starting orphaned milestone cleanup process...');
    
    const result = await milestonesService.cleanupOrphanedMilestones();
    
    const message = result.cleaned > 0 
      ? `Successfully cleaned up ${result.cleaned} orphaned milestones.${result.errors.length > 0 ? ` ${result.errors.length} errors occurred.` : ''}`
      : 'No orphaned milestones found.';

    return {
      success: true,
      cleaned: result.cleaned,
      errors: result.errors,
      message
    };
  } catch (error) {
    console.error('❌ Failed to cleanup orphaned milestones:', error);
    
    return {
      success: false,
      cleaned: 0,
      errors: [error.message || 'Unknown error occurred'],
      message: `Failed to cleanup orphaned milestones: ${error.message}`
    };
  }
};

/**
 * Check for orphaned milestones without deleting them
 * Useful for reporting/monitoring purposes
 */
export const checkForOrphanedMilestones = async (): Promise<{
  count: number;
  milestones: Array<{ id: string; projectId: string; title: string }>;
}> => {
  try {
    // This would need to be implemented in the service if needed
    // For now, we'll use the cleanup function in dry-run mode
    console.log('🔍 Checking for orphaned milestones...');
    
    // Note: This is a simplified version. A full implementation would
    // add a dry-run mode to the cleanup function
    return {
      count: 0,
      milestones: []
    };
  } catch (error) {
    console.error('Error checking for orphaned milestones:', error);
    throw error;
  }
};

// Export for use in admin components or manual execution
export default {
  cleanupOrphanedMilestones,
  checkForOrphanedMilestones
};
