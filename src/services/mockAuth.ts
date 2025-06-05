// Mock authentication service for development
// This allows the app to work without Firebase configuration

export const mockUsers = [
  {
    uid: 'admin-1',
    email: 'admin@mysteel.com',
    name: 'Admin User',
    role: 'admin' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'sales-1',
    email: 'sales@mysteel.com',
    name: 'Sales User',
    role: 'sales' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'designer-1',
    email: 'designer@mysteel.com',
    name: 'Designer User',
    role: 'designer' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'production-1',
    email: 'production@mysteel.com',
    name: 'Production User',
    role: 'production' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'installation-1',
    email: 'installation@mysteel.com',
    name: 'Installation User',
    role: 'installation' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockLogin = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (password !== 'password123') {
    throw new Error('Invalid password');
  }
  
  return user;
};

export const mockRegister = async (email: string, password: string, name: string, role: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newUser = {
    uid: `${role}-${Date.now()}`,
    email,
    name,
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockUsers.push(newUser);
  return newUser;
};
