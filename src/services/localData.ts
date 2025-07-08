// Local Data Service - Mock data for development and fallback
import type { Project, User, Complaint, Milestone } from '../types';

// Mock project data
const mockProjects: Project[] = [
  {
    id: 'proj_1',
    projectName: 'Demo Project 1',
    amount: 150000,
    estimatedCompletionDate: new Date('2024-12-31'),
    status: 'production',
    createdBy: 'demo_user',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'proj_2',
    projectName: 'Demo Project 2', 
    amount: 275000,
    estimatedCompletionDate: new Date('2024-11-30'),
    status: 'installation',
    createdBy: 'demo_user',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  }
];

// Mock user data
const mockUsers: User[] = [
  {
    uid: 'demo_admin',
    email: 'admin@mysteel.com',
    name: 'Demo Admin',
    role: 'admin',
    employeeId: 'A0001',
    department: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    passwordSet: true,
    isTemporary: false
  },
  {
    uid: 'demo_sales',
    email: 'sales@mysteel.com',
    name: 'Demo Sales',
    role: 'sales',
    employeeId: 'S0001',
    department: 'sales',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    passwordSet: true,
    isTemporary: false
  }
];

// Mock complaints data
const mockComplaints: Complaint[] = [
  {
    id: 'comp_1',
    projectId: 'proj_1',
    title: 'Demo Complaint',
    description: 'This is a demo complaint for testing purposes.',
    priority: 'medium',
    status: 'open',
    submittedBy: 'demo_user',
    submittedAt: new Date('2024-01-20'),
    assignedTo: 'demo_admin',
    attachments: []
  }
];

export const localData = {
  // Projects
  getProjects: () => Promise.resolve([...mockProjects]),
  getProject: (id: string) => Promise.resolve(mockProjects.find(p => p.id === id) || null),
  createProject: (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: `proj_${Date.now()}` };
    mockProjects.push(newProject);
    return Promise.resolve(newProject);
  },
  updateProject: (id: string, updates: Partial<Project>) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index >= 0) {
      mockProjects[index] = { ...mockProjects[index], ...updates, updatedAt: new Date() };
      return Promise.resolve(mockProjects[index]);
    }
    return Promise.reject(new Error('Project not found'));
  },
  deleteProject: (id: string) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index >= 0) {
      mockProjects.splice(index, 1);
      return Promise.resolve();
    }
    return Promise.reject(new Error('Project not found'));
  },

  // Users
  getUsers: () => Promise.resolve([...mockUsers]),
  getUser: (id: string) => Promise.resolve(mockUsers.find(u => u.uid === id) || null),
  getUserByEmail: (email: string) => Promise.resolve(mockUsers.find(u => u.email === email) || null),
  getUserByEmployeeId: (employeeId: string) => Promise.resolve(mockUsers.find(u => u.employeeId === employeeId) || null),
  createUser: (user: Omit<User, 'uid'>) => {
    const newUser = { ...user, uid: `user_${Date.now()}` };
    mockUsers.push(newUser);
    return Promise.resolve(newUser);
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const index = mockUsers.findIndex(u => u.uid === id);
    if (index >= 0) {
      mockUsers[index] = { ...mockUsers[index], ...updates, updatedAt: new Date() };
      return Promise.resolve(mockUsers[index]);
    }
    return Promise.reject(new Error('User not found'));
  },

  // Complaints
  getComplaints: () => Promise.resolve([...mockComplaints]),
  getComplaint: (id: string) => Promise.resolve(mockComplaints.find(c => c.id === id) || null),
  getComplaintsByProject: (projectId: string) => Promise.resolve(mockComplaints.filter(c => c.projectId === projectId)),
  createComplaint: (complaint: Omit<Complaint, 'id'>) => {
    const newComplaint = { ...complaint, id: `comp_${Date.now()}` };
    mockComplaints.push(newComplaint);
    return Promise.resolve(newComplaint);
  },
  updateComplaint: (id: string, updates: Partial<Complaint>) => {
    const index = mockComplaints.findIndex(c => c.id === id);
    if (index >= 0) {
      mockComplaints[index] = { ...mockComplaints[index], ...updates };
      return Promise.resolve(mockComplaints[index]);
    }
    return Promise.reject(new Error('Complaint not found'));
  },

  // Statistics
  getStatistics: () => Promise.resolve({
    totalProjects: mockProjects.length,
    activeProjects: mockProjects.filter(p => p.status === 'production' || p.status === 'installation').length,
    completedProjects: mockProjects.filter(p => p.status === 'completed').length,
    totalUsers: mockUsers.length,
    totalComplaints: mockComplaints.length,
    openComplaints: mockComplaints.filter(c => c.status === 'open').length
  })
};

export default localData;
