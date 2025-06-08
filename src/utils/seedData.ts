import { projectsService, complaintsService, usersService, milestonesService } from '../services/firebaseService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Sample projects data
const sampleProjects = [
  {
    name: 'Mysteel Office Complex',
    description: 'Modern office building with steel framework and glass facade',
    amount: 2500000,
    completionDate: '2024-12-15',
    status: 'Production' as const,
    createdBy: 'admin-user-id',
    priority: 'high' as const,
    progress: 65
  },
  {
    name: 'Industrial Warehouse Project',
    description: 'Large-scale warehouse facility for manufacturing operations',
    amount: 1800000,
    completionDate: '2024-10-30',
    status: 'DNE' as const,
    createdBy: 'sales-user-id',
    priority: 'medium' as const,
    progress: 25
  },
  {
    name: 'Residential Tower Development',
    description: 'High-rise residential building with modern amenities',
    amount: 4200000,
    completionDate: '2025-03-20',
    status: 'Installation' as const,
    createdBy: 'admin-user-id',
    priority: 'high' as const,
    progress: 85
  },
  {
    name: 'Shopping Mall Renovation',
    description: 'Complete renovation of existing shopping center',
    amount: 3100000,
    completionDate: '2024-08-15',
    status: 'Completed' as const,
    createdBy: 'sales-user-id',
    priority: 'medium' as const,
    progress: 100
  },
  {
    name: 'School Building Construction',
    description: 'New educational facility with modern classrooms',
    amount: 1500000,
    completionDate: '2024-11-10',
    status: 'Production' as const,
    createdBy: 'admin-user-id',
    priority: 'high' as const,
    progress: 45
  },
  {
    name: 'Hospital Wing Extension',
    description: 'Additional wing for medical facility expansion',
    amount: 2800000,
    completionDate: '2025-01-25',
    status: 'DNE' as const,
    createdBy: 'sales-user-id',
    priority: 'high' as const,
    progress: 15
  }
];

// Sample complaints data
const sampleComplaints = [
  {
    title: 'Installation Delay Issue',
    description: 'The installation team was delayed by 3 days without proper notification to the client.',
    customerName: 'John Doe',
    projectId: '', // Will be filled with actual project ID
    status: 'open' as const,
    priority: 'high' as const,
    createdBy: 'sales-user-id'
  },
  {
    title: 'Material Quality Concern',
    description: 'Some steel beams delivered have minor surface defects that need attention.',
    customerName: 'Jane Smith',
    projectId: '', // Will be filled with actual project ID
    status: 'in-progress' as const,
    priority: 'medium' as const,
    createdBy: 'admin-user-id'
  },
  {
    title: 'Communication Gap',
    description: 'Client reports lack of regular updates on project progress and milestones.',
    customerName: 'Mike Johnson',
    projectId: '', // Will be filled with actual project ID
    status: 'resolved' as const,
    priority: 'low' as const,
    createdBy: 'sales-user-id'
  },
  {
    title: 'Safety Protocol Violation',
    description: 'Workers observed not following proper safety protocols on site.',
    customerName: 'Sarah Wilson',
    projectId: '', // Will be filled with actual project ID
    status: 'open' as const,
    priority: 'high' as const,
    createdBy: 'admin-user-id'
  },
  {
    title: 'Design Modification Request',
    description: 'Client requesting changes to the original design specifications.',
    customerName: 'Robert Brown',
    projectId: '', // Will be filled with actual project ID
    status: 'in-progress' as const,
    priority: 'medium' as const,
    createdBy: 'sales-user-id'
  }
];

// Sample users data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@mysteel.com',
    role: 'admin' as const,
    status: 'active' as const
  },
  {
    name: 'Sales Manager',
    email: 'sales@mysteel.com',
    role: 'sales' as const,
    status: 'active' as const
  },
  {
    name: 'Design Engineer',
    email: 'designer@mysteel.com',
    role: 'designer' as const,
    status: 'active' as const
  },
  {
    name: 'Production Manager',
    email: 'production@mysteel.com',
    role: 'production' as const,
    status: 'active' as const
  },
  {
    name: 'Installation Supervisor',
    email: 'installation@mysteel.com',
    role: 'installation' as const,
    status: 'active' as const
  }
];

// Sample milestones data
const sampleMilestones = [
  {
    title: 'Foundation Work',
    description: 'Complete foundation and basement construction',
    dueDate: '2024-09-15',
    status: 'completed' as const,
    priority: 'high' as const,
    assignedTo: 'production@mysteel.com',
    progress: 100
  },
  {
    title: 'Steel Framework',
    description: 'Install main steel framework structure',
    dueDate: '2024-10-01',
    status: 'in-progress' as const,
    priority: 'high' as const,
    assignedTo: 'production@mysteel.com',
    progress: 75
  },
  {
    title: 'Exterior Walls',
    description: 'Complete exterior wall installation',
    dueDate: '2024-10-15',
    status: 'pending' as const,
    priority: 'medium' as const,
    assignedTo: 'installation@mysteel.com',
    progress: 0
  },
  {
    title: 'Interior Finishing',
    description: 'Complete interior finishing work',
    dueDate: '2024-11-01',
    status: 'pending' as const,
    priority: 'medium' as const,
    assignedTo: 'installation@mysteel.com',
    progress: 0
  }
];

// Sample sales data
const sampleSalesData = [
  {
    projectName: 'Corporate Headquarters',
    clientName: 'Tech Solutions Inc.',
    contactPerson: 'John Smith',
    contactEmail: 'john.smith@techsolutions.com',
    contactPhone: '+60123456789',
    estimatedAmount: 3500000,
    proposedStartDate: '2024-11-01',
    estimatedDuration: '8 months',
    notes: 'High-priority client with potential for future projects',
    status: 'proposal' as const,
    submittedBy: 'sales@mysteel.com'
  },
  {
    projectName: 'Retail Complex Phase 2',
    clientName: 'Mall Development Corp',
    contactPerson: 'Sarah Johnson',
    contactEmail: 'sarah.j@malldev.com',
    contactPhone: '+60198765432',
    estimatedAmount: 2800000,
    proposedStartDate: '2024-12-15',
    estimatedDuration: '6 months',
    notes: 'Extension of existing project, familiar client',
    status: 'negotiation' as const,
    submittedBy: 'sales@mysteel.com'
  }
];

// Sample design data
const sampleDesignData = [
  {
    projectName: 'Modern Office Tower',
    designType: 'Architectural & Structural',
    designStatus: 'completed' as const,
    designerAssigned: 'designer@mysteel.com',
    startDate: '2024-07-01',
    completionDate: '2024-08-15',
    revisionCount: 2,
    clientApproval: true,
    notes: 'Client requested minor modifications to lobby design',
    files: ['floor-plans.pdf', 'structural-drawings.dwg']
  },
  {
    projectName: 'Industrial Facility',
    designType: 'Structural Engineering',
    designStatus: 'in-progress' as const,
    designerAssigned: 'designer@mysteel.com',
    startDate: '2024-08-01',
    completionDate: null,
    revisionCount: 1,
    clientApproval: false,
    notes: 'Awaiting client feedback on structural specifications',
    files: ['preliminary-design.pdf']
  }
];

// Sample production data
const sampleProductionData = [
  {
    projectName: 'Steel Framework Assembly',
    productionStage: 'fabrication' as const,
    assignedTeam: 'Team Alpha',
    supervisor: 'production@mysteel.com',
    startDate: '2024-08-15',
    estimatedCompletion: '2024-09-30',
    materialStatus: 'in-stock' as const,
    qualityChecks: 3,
    notes: 'All materials received, fabrication proceeding on schedule'
  },
  {
    projectName: 'Warehouse Structure',
    productionStage: 'quality-control' as const,
    assignedTeam: 'Team Beta',
    supervisor: 'production@mysteel.com',
    startDate: '2024-07-01',
    estimatedCompletion: '2024-08-15',
    materialStatus: 'completed' as const,
    qualityChecks: 5,
    notes: 'Final quality inspection in progress'
  }
];

// Sample installation data
const sampleInstallationData = [
  {
    projectName: 'Office Complex Installation',
    installationPhase: 'structural' as const,
    teamLead: 'installation@mysteel.com',
    crewSize: 8,
    startDate: '2024-09-01',
    estimatedCompletion: '2024-10-15',
    safetyIncidents: 0,
    progressPhotos: ['progress-1.jpg', 'progress-2.jpg'],
    notes: 'Installation proceeding smoothly, weather conditions favorable'
  },
  {
    projectName: 'Retail Center Installation',
    installationPhase: 'finishing' as const,
    teamLead: 'installation@mysteel.com',
    crewSize: 6,
    startDate: '2024-08-15',
    estimatedCompletion: '2024-09-30',
    safetyIncidents: 0,
    progressPhotos: ['finishing-1.jpg', 'finishing-2.jpg'],
    notes: 'Final touches and quality checks in progress'
  }
];

export const seedFirebaseData = async () => {
  try {
    console.log('🌱 Starting to seed Firebase data...');

    // Create users first
    console.log('👥 Creating users...');
    const userIds: string[] = [];
    for (const userData of sampleUsers) {
      try {
        const userId = await usersService.createUser(userData);
        userIds.push(userId);
        console.log(`✅ Created user: ${userData.name}`);
      } catch (error) {
        console.log(`⚠️ User ${userData.email} might already exist, skipping...`);
      }
    }

    // Create projects
    console.log('📋 Creating projects...');
    const projectIds: string[] = [];
    for (const projectData of sampleProjects) {
      try {
        const projectId = await projectsService.createProject({
          ...projectData,
          createdBy: userIds[0] || 'default-user-id' // Use first user ID or default
        });
        projectIds.push(projectId);
        console.log(`✅ Created project: ${projectData.name}`);
      } catch (error) {
        console.error(`❌ Error creating project ${projectData.name}:`, error);
      }
    }

    // Create complaints with actual project IDs
    console.log('💬 Creating complaints...');
    for (let i = 0; i < sampleComplaints.length; i++) {
      const complaintData = {
        ...sampleComplaints[i],
        projectId: projectIds[i % projectIds.length] || 'default-project-id',
        createdBy: userIds[i % userIds.length] || 'default-user-id'
      };
      
      try {
        await complaintsService.createComplaint(complaintData);
        console.log(`✅ Created complaint: ${complaintData.title}`);
      } catch (error) {
        console.error(`❌ Error creating complaint ${complaintData.title}:`, error);
      }
    }

    // Create milestones for projects
    console.log('🎯 Creating milestones...');
    for (let i = 0; i < sampleMilestones.length; i++) {
      const milestoneData = {
        ...sampleMilestones[i],
        projectId: projectIds[i % projectIds.length] || 'default-project-id',
        createdBy: userIds[0] || 'default-user-id'
      };

      try {
        await milestonesService.createMilestone(milestoneData);
        console.log(`✅ Created milestone: ${milestoneData.title}`);
      } catch (error) {
        console.error(`❌ Error creating milestone ${milestoneData.title}:`, error);
      }
    }

    // Create sales data
    console.log('💼 Creating sales data...');
    for (const salesData of sampleSalesData) {
      try {
        await addDoc(collection(db, 'sales'), {
          ...salesData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Created sales entry: ${salesData.projectName}`);
      } catch (error) {
        console.error(`❌ Error creating sales data ${salesData.projectName}:`, error);
      }
    }

    // Create design data
    console.log('🎨 Creating design data...');
    for (const designData of sampleDesignData) {
      try {
        await addDoc(collection(db, 'design'), {
          ...designData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Created design entry: ${designData.projectName}`);
      } catch (error) {
        console.error(`❌ Error creating design data ${designData.projectName}:`, error);
      }
    }

    // Create production data
    console.log('🏭 Creating production data...');
    for (const productionData of sampleProductionData) {
      try {
        await addDoc(collection(db, 'production'), {
          ...productionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Created production entry: ${productionData.projectName}`);
      } catch (error) {
        console.error(`❌ Error creating production data ${productionData.projectName}:`, error);
      }
    }

    // Create installation data
    console.log('🔧 Creating installation data...');
    for (const installationData of sampleInstallationData) {
      try {
        await addDoc(collection(db, 'installation'), {
          ...installationData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Created installation entry: ${installationData.projectName}`);
      } catch (error) {
        console.error(`❌ Error creating installation data ${installationData.projectName}:`, error);
      }
    }

    console.log('🎉 Firebase data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${sampleUsers.length}`);
    console.log(`   - Projects: ${sampleProjects.length}`);
    console.log(`   - Complaints: ${sampleComplaints.length}`);
    console.log(`   - Milestones: ${sampleMilestones.length}`);
    console.log(`   - Sales Entries: ${sampleSalesData.length}`);
    console.log(`   - Design Entries: ${sampleDesignData.length}`);
    console.log(`   - Production Entries: ${sampleProductionData.length}`);
    console.log(`   - Installation Entries: ${sampleInstallationData.length}`);

  } catch (error) {
    console.error('❌ Error seeding Firebase data:', error);
    throw error;
  }
};

// Function to clear all data (use with caution!)
export const clearFirebaseData = async () => {
  console.log('🧹 This function would clear all Firebase data...');
  console.log('⚠️ Implementation requires admin SDK for bulk operations');
  console.log('💡 For now, manually delete collections from Firebase Console');
};
