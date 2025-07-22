export type UserRole = 'admin' | 'sales' | 'designer' | 'production' | 'installation';

export interface User {
  employeeId: string; // Primary identifier - required
  name: string;
  role: UserRole;
  department?: string;
  status?: 'active' | 'inactive';
  passwordHash?: string; // Secure password hash (not plaintext)
  passwordSet?: boolean; // Track if user has set their password
  isTemporary?: boolean; // Track if account is temporary (admin-created)
  lastLogin?: Date; // Track last login time
  createdAt: Date;
  updatedAt: Date;
  // Legacy fields for backward compatibility during transition
  uid?: string; // Optional for backward compatibility
  email?: string; // Optional for backward compatibility
}

export type ProjectStatus = 'sales' | 'dne' | 'production' | 'installation' | 'completed';

export interface Project {
  id: string;
  projectName: string;
  name?: string; // Add alias for projectName for compatibility
  amount: number;
  estimatedCompletionDate: Date;
  deliveryDate?: Date; // Add for compatibility
  completionDate?: Date; // Add for compatibility
  status: ProjectStatus;
  createdBy: string; // Employee name (not UID)
  createdAt: Date;
  updatedAt: Date;
  salesData?: SalesData;
  designData?: DesignData;
  productionData?: ProductionData;
  installationData?: InstallationData;
  // Additional fields for better tracking
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
  files?: string[];
}

export interface SalesData {
  projectId: string;
  submittedBy: string; // Employee name (not UID)
  submittedAt: Date;
  notes?: string;
}

export type DesignStatus = 'pending' | 'partial' | 'completed';

export interface DesignData {
  projectId: string;
  status: DesignStatus;
  partialCompletedAt?: Date;
  completedAt?: Date;
  assignedTo?: string; // Employee name (not UID)
  assignedAt?: Date; // Add for compatibility
  notes?: string;
  lastModified: Date;
  // Track if project has already flowed from partial to production/installation
  hasFlowedFromPartial?: boolean;
}

export interface Milestone {
  id: string;
  projectId?: string; // Add for compatibility
  name: string;
  title?: string; // Add alias for name for compatibility
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate?: Date;
  dueDate?: Date; // Add for compatibility
  completedDate?: Date;
  progress?: number; // Add for compatibility
  files?: Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt: Date | string | any; // Allow Firestore timestamps
    uploadedBy: string; // Employee name (not UID)
  }>; // Add for compatibility
  images?: Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt: Date | string | any; // Allow Firestore timestamps
    uploadedBy: string; // Employee name (not UID)
  }>; // Add images property for milestone image uploads
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  assignedTo?: string; // Employee name (not UID)
}

export interface ProductionData {
  projectId: string;
  milestones?: Milestone[]; // Make optional for compatibility
  assignedBy: string; // Employee name (not UID)
  assignedAt: Date;
  notes?: string;
  lastModified: Date;
  deliveryDate?: Date; // Add for compatibility
  completedAt?: Date; // Add for compatibility
}

export interface InstallationPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: Date;
  uploadedBy: string; // Employee name (not UID)
  milestoneId?: string;
  // Enhanced photo organization
  date: string; // YYYY-MM-DD format for folder organization
  folderPath: string; // Full path for organized storage
}

export interface InstallationData {
  projectId: string;
  milestoneStatuses: Record<string, 'pending' | 'in-progress' | 'completed'>;
  photos: InstallationPhoto[];
  assignedTo?: string; // Employee name (not UID)
  assignedAt?: Date; // Add for compatibility
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  lastModified: Date;
  deliveryDate?: Date; // Add for compatibility
  // Enhanced milestone tracking
  milestoneProgress: Record<string, {
    status: 'pending' | 'in-progress' | 'completed';
    startedAt?: Date;
    completedAt?: Date;
    notes?: string;
  }>;
}

export interface Complaint {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  customerName?: string; // Add for compatibility
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department?: 'sales' | 'designer' | 'production' | 'installation'; // Add for compatibility
  submittedBy: string; // Employee name (not UID)
  createdBy?: string; // Employee name (not UID) - Add alias for submittedBy for compatibility
  assignedTo?: string; // Employee name (not UID)
  submittedAt: Date;
  createdAt?: Date; // Add alias for submittedAt for compatibility
  updatedAt?: Date; // Add for compatibility
  resolvedAt?: Date;
  resolution?: string;
  attachments?: string[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectsByStatus: Record<ProjectStatus, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'project_created' | 'status_updated' | 'milestone_completed' | 'complaint_submitted';
  projectId?: string;
  description: string;
  timestamp: Date;
  userId: string; // Employee ID (not UID) - kept for backward compatibility
  userName: string; // Employee name - primary display field
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  statusUpdates: boolean;
  milestoneReminders: boolean;
  complaintAlerts: boolean;
}
