import { type UserRole } from '../types/index';

// Role-based permission system
export interface ModulePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

export const getModulePermissions = (userRole: UserRole, moduleType: string): ModulePermissions => {
  // Edit permissions - only specific roles can edit each module
  const editPermissions: Record<string, UserRole[]> = {
    sales: ['admin', 'sales'],
    design: ['admin', 'designer'],
    production: ['admin', 'production'],
    installation: ['admin', 'installation'],
    tracker: [], // Master Tracker is VIEW-ONLY for all users - no editing allowed
    complaints: ['admin', 'sales', 'designer', 'production', 'installation']
  };

  const canEdit = editPermissions[moduleType]?.includes(userRole) || false;
  // All users can view all modules - this is the key requirement
  const canView = true;

  return {
    canView,
    canEdit,
    canDelete: canEdit && userRole === 'admin', // Only admin can delete
    canCreate: canEdit
  };
};

export const canViewAmount = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'sales';
};

export const canEditProject = (userRole: UserRole, projectStatus: string): boolean => {
  const statusPermissions: Record<string, UserRole[]> = {
    'sales': ['admin', 'sales'],
    'dne': ['admin', 'designer'],
    'production': ['admin', 'production'],
    'installation': ['admin', 'installation'],
    'completed': ['admin'] // Only admin can edit completed projects
  };

  return statusPermissions[projectStatus.toLowerCase()]?.includes(userRole) || false;
};

export const getNextValidStatuses = (currentStatus: string, userRole: UserRole): string[] => {
  const statusFlow: Record<string, string[]> = {
    'sales': ['dne'],
    'dne': ['production', 'installation'],
    'production': ['installation'],
    'installation': ['completed'],
    'completed': []
  };

  const validNextStatuses = statusFlow[currentStatus.toLowerCase()] || [];
  
  // Filter based on user permissions
  return validNextStatuses.filter(status => canEditProject(userRole, status));
};
