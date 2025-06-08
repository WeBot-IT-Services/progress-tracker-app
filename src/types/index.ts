export type UserRole = 'admin' | 'sales' | 'designer' | 'production' | 'installation';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'sales' | 'dne' | 'production' | 'installation' | 'completed';

export interface Project {
  id: string;
  projectName: string;
  amount: number;
  estimatedCompletionDate: Date;
  status: ProjectStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  salesData?: SalesData;
  designData?: DesignData;
  productionData?: ProductionData;
  installationData?: InstallationData;
}

export interface SalesData {
  projectId: string;
  submittedBy: string;
  submittedAt: Date;
  notes?: string;
}

export type DesignStatus = 'pending' | 'partial' | 'completed';

export interface DesignData {
  projectId: string;
  status: DesignStatus;
  partialCompletedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;
  notes?: string;
  lastModified: Date;
}

export interface Milestone {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate?: Date;
  completedDate?: Date;
  notes?: string;
}

export interface ProductionData {
  projectId: string;
  milestones: Milestone[];
  assignedBy: string;
  assignedAt: Date;
  notes?: string;
  lastModified: Date;
}

export interface InstallationPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: Date;
  uploadedBy: string;
  milestoneId?: string;
}

export interface InstallationData {
  projectId: string;
  milestoneStatuses: Record<string, 'pending' | 'in-progress' | 'completed'>;
  photos: InstallationPhoto[];
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  lastModified: Date;
}

export interface Complaint {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy: string;
  assignedTo?: string;
  submittedAt: Date;
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
  userId: string;
  userName: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  statusUpdates: boolean;
  milestoneReminders: boolean;
  complaintAlerts: boolean;
}
