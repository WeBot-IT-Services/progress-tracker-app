import React, { useState } from 'react';
import { Database, Users, FileText, AlertTriangle } from 'lucide-react';
import { auth, db } from '../../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FirestorePopulator: React.FC = () => {
  const [isPopulating, setIsPopulating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // User data to create - Mysteel Construction
  const users = [
    {
      email: 'admin@mysteel.com',
      password: 'MS2024!Admin#Secure',
      name: 'System Administrator',
      role: 'admin',
      department: 'Administration',
      status: 'active'
    },
    {
      email: 'sales@mysteel.com',
      password: 'MS2024!Sales#Manager',
      name: 'Sales Manager',
      role: 'sales',
      department: 'Sales',
      status: 'active'
    },
    {
      email: 'design@mysteel.com',
      password: 'MS2024!Design#Engineer',
      name: 'Design Engineer',
      role: 'designer',
      department: 'Design & Engineering',
      status: 'active'
    },
    {
      email: 'production@mysteel.com',
      password: 'MS2024!Prod#Manager',
      name: 'Production Manager',
      role: 'production',
      department: 'Production',
      status: 'active'
    },
    {
      email: 'installation@mysteel.com',
      password: 'MS2024!Install#Super',
      name: 'Installation Supervisor',
      role: 'installation',
      department: 'Installation',
      status: 'active'
    }
  ];

  // Sample projects data
  const projects = [
    {
      name: 'Warehouse Racking System - KL',
      description: 'Complete warehouse racking solution for Kuala Lumpur facility',
      amount: 150000,
      completionDate: '2025-03-15',
      status: 'sales',
      progress: 10,
      createdBy: 'sales@mysteel.com'
    },
    {
      name: 'Industrial Storage - Johor',
      description: 'Heavy-duty industrial storage system for manufacturing plant',
      amount: 280000,
      completionDate: '2025-04-20',
      status: 'dne',
      progress: 25,
      createdBy: 'sales@mysteel.com'
    },
    {
      name: 'Cold Storage Racking - Penang',
      description: 'Specialized cold storage racking system with temperature resistance',
      amount: 320000,
      completionDate: '2025-02-28',
      status: 'production',
      progress: 60,
      createdBy: 'sales@mysteel.com'
    },
    {
      name: 'Automated Storage - Selangor',
      description: 'Automated storage and retrieval system integration',
      amount: 450000,
      completionDate: '2025-05-10',
      status: 'installation',
      progress: 85,
      createdBy: 'sales@mysteel.com'
    },
    {
      name: 'Retail Display System - Melaka',
      description: 'Custom retail display and storage solution',
      amount: 95000,
      completionDate: '2024-12-15',
      status: 'completed',
      progress: 100,
      createdBy: 'sales@mysteel.com'
    }
  ];

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const populateFirestore = async () => {
    setIsPopulating(true);
    setProgress([]);
    setError(null);

    try {
      addProgress('🚀 Starting Firestore population for mysteel Construction...');

      // 1. Create Firebase Auth users and Firestore user profiles
      addProgress('👥 Creating users...');
      const createdUsers = [];

      for (const userData of users) {
        try {
          // Create Firebase Auth user
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
          );

          // Create Firestore user profile
          const userDoc = await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            department: userData.department,
            status: userData.status,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });

          createdUsers.push({
            id: userDoc.id,
            uid: userCredential.user.uid,
            ...userData
          });

          addProgress(`✅ Created user: ${userData.email} (${userData.role})`);
        } catch (error: any) {
          addProgress(`❌ Error creating user ${userData.email}: ${error.message}`);
        }
      }

      // 2. Create projects
      addProgress('📋 Creating projects...');
      const createdProjects = [];

      for (const projectData of projects) {
        try {
          const projectDoc = await addDoc(collection(db, 'projects'), {
            ...projectData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          createdProjects.push({
            id: projectDoc.id,
            ...projectData
          });

          addProgress(`✅ Created project: ${projectData.name} (${projectData.status})`);
        } catch (error: any) {
          addProgress(`❌ Error creating project ${projectData.name}: ${error.message}`);
        }
      }

      // 3. Create sample complaints
      addProgress('📝 Creating complaints...');
      const complaints = [
        {
          title: 'Delayed Installation Schedule',
          description: 'Installation team arrived 2 days late, causing project delays',
          customerName: 'ABC Manufacturing Sdn Bhd',
          projectId: createdProjects[3]?.id || '',
          status: 'open',
          priority: 'high',
          department: 'installation',
          createdBy: createdUsers[1]?.uid || ''
        },
        {
          title: 'Design Specification Issue',
          description: 'Racking dimensions do not match warehouse specifications',
          customerName: 'XYZ Logistics Sdn Bhd',
          projectId: createdProjects[1]?.id || '',
          status: 'in-progress',
          priority: 'medium',
          department: 'designer',
          createdBy: createdUsers[2]?.uid || ''
        },
        {
          title: 'Quality Control Concern',
          description: 'Some welding joints show signs of poor quality',
          customerName: 'DEF Storage Solutions',
          projectId: createdProjects[2]?.id || '',
          status: 'resolved',
          priority: 'high',
          department: 'production',
          createdBy: createdUsers[3]?.uid || ''
        }
      ];

      for (const complaintData of complaints) {
        try {
          await addDoc(collection(db, 'complaints'), {
            ...complaintData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          addProgress(`✅ Created complaint: ${complaintData.title} (${complaintData.department})`);
        } catch (error: any) {
          addProgress(`❌ Error creating complaint: ${error.message}`);
        }
      }

      addProgress('🎉 Firestore population completed successfully!');
      addProgress(`📊 Summary: ${createdUsers.length} users, ${createdProjects.length} projects, ${complaints.length} complaints`);

    } catch (error: any) {
      setError(`Error during population: ${error.message}`);
      addProgress(`💥 Error: ${error.message}`);
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Firestore Data Populator</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Warning</h4>
              <p className="text-sm text-yellow-700">
                This will create new users and data in Firestore. Make sure you've cleared existing data first.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-blue-900">5 Users</div>
            <div className="text-xs text-blue-600">All roles</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-green-900">5 Projects</div>
            <div className="text-xs text-green-600">All stages</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <AlertTriangle className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-purple-900">3 Complaints</div>
            <div className="text-xs text-purple-600">Sample data</div>
          </div>
        </div>

        <button
          onClick={populateFirestore}
          disabled={isPopulating}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium"
        >
          {isPopulating ? 'Populating Firestore...' : 'Populate Firestore Data'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {progress.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <h4 className="font-medium text-gray-900 mb-2">Progress Log</h4>
            <div className="space-y-1 text-sm font-mono">
              {progress.map((msg, index) => (
                <div key={index} className="text-gray-700">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirestorePopulator;
