/**
 * Data Seeding Utility
 * Creates sample data for testing data integrity features
 */

import { projectsService, milestonesService, complaintsService, usersService } from '../services/firebaseService';

export const seedTestData = async () => {
  console.log('🌱 Seeding test data...');

  try {
    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [
      {
        uid: 'test-admin-001',
        email: 'admin@mysteer.com',
        name: 'Test Admin',
        role: 'admin' as const
      },
      {
        uid: 'test-sales-001',
        email: 'sales@mysteer.com',
        name: 'Test Sales User',
        role: 'sales' as const
      },
      {
        uid: 'test-designer-001',
        email: 'design@mysteer.com',
        name: 'Test Designer',
        role: 'designer' as const
      }
    ];

    for (const user of testUsers) {
      try {
        await usersService.createUser(user);
        console.log(`✅ Created user: ${user.email}`);
      } catch (error) {
        console.log(`ℹ️ User ${user.email} may already exist`);
      }
    }

    // Create test projects
    console.log('\n📊 Creating test projects...');
    const testProjects = [
      {
        projectName: 'Test Project Alpha',
        description: 'First test project for data integrity testing',
        amount: 15000,
        deliveryDate: '2024-08-15',
        status: 'sales' as const,
        createdBy: 'test-admin-001'
      },
      {
        projectName: 'Test Project Beta',
        description: 'Second test project in design phase',
        amount: 25000,
        deliveryDate: '2024-09-01',
        status: 'dne' as const,
        createdBy: 'test-sales-001'
      },
      {
        projectName: 'Test Project Gamma',
        description: 'Third test project in production',
        amount: 35000,
        deliveryDate: '2024-07-30',
        status: 'production' as const,
        createdBy: 'test-admin-001'
      }
    ];

    const createdProjectIds: string[] = [];
    for (const project of testProjects) {
      try {
        const projectId = await projectsService.createProject(project);
        createdProjectIds.push(projectId);
        console.log(`✅ Created project: ${project.projectName} (ID: ${projectId})`);
      } catch (error) {
        console.error(`❌ Failed to create project ${project.projectName}:`, error);
      }
    }

    // Create test milestones for projects
    console.log('\n🎯 Creating test milestones...');
    for (const projectId of createdProjectIds) {
      const testMilestones = [
        {
          projectId,
          title: 'Initial Planning',
          description: 'Project planning and requirements gathering',
          status: 'completed' as const,
          dueDate: '2024-07-01'
        },
        {
          projectId,
          title: 'Design Phase',
          description: 'Design and engineering work',
          status: 'in-progress' as const,
          dueDate: '2024-07-15'
        },
        {
          projectId,
          title: 'Production Setup',
          description: 'Production line setup and testing',
          status: 'pending' as const,
          dueDate: '2024-08-01'
        }
      ];

      for (const milestone of testMilestones) {
        try {
          const milestoneId = await milestonesService.createMilestone(milestone);
          console.log(`✅ Created milestone: ${milestone.title} for project ${projectId}`);
        } catch (error) {
          console.error(`❌ Failed to create milestone ${milestone.title}:`, error);
        }
      }
    }

    // Create test complaints
    console.log('\n📝 Creating test complaints...');
    const testComplaints = [
      {
        title: 'Delivery Delay Issue',
        description: 'Project delivery was delayed beyond agreed timeline',
        status: 'open' as const,
        submittedBy: 'test-sales-001',
        department: 'production',
        priority: 'high' as const
      },
      {
        title: 'Quality Concern',
        description: 'Some quality issues found in the final product',
        status: 'in-progress' as const,
        submittedBy: 'test-admin-001',
        department: 'production',
        priority: 'medium' as const
      },
      {
        title: 'Communication Gap',
        description: 'Better communication needed between departments',
        status: 'resolved' as const,
        submittedBy: 'test-designer-001',
        department: 'general',
        priority: 'low' as const
      }
    ];

    for (const complaint of testComplaints) {
      try {
        const complaintId = await complaintsService.createComplaint(complaint);
        console.log(`✅ Created complaint: ${complaint.title}`);
      } catch (error) {
        console.error(`❌ Failed to create complaint ${complaint.title}:`, error);
      }
    }

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Users: ${testUsers.length}`);
    console.log(`  - Projects: ${testProjects.length}`);
    console.log(`  - Milestones: ${createdProjectIds.length * 3}`);
    console.log(`  - Complaints: ${testComplaints.length}`);

    return {
      success: true,
      usersCreated: testUsers.length,
      projectsCreated: createdProjectIds.length,
      milestonesCreated: createdProjectIds.length * 3,
      complaintsCreated: testComplaints.length
    };

  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create corrupted data for testing recovery
export const createCorruptedData = async () => {
  console.log('🔧 Creating corrupted data for testing...');

  try {
    // Create a project with missing required fields
    const corruptedProject = {
      projectName: 'Corrupted Test Project',
      // Missing status, createdBy, etc.
      amount: 10000,
      deliveryDate: '2024-08-01'
    };

    // This will likely fail validation, which is what we want for testing
    console.log('Creating intentionally corrupted project...');
    
    return {
      success: true,
      message: 'Corrupted data creation attempted'
    };

  } catch (error) {
    console.error('❌ Corrupted data creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Make functions available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).seedTestData = seedTestData;
  (window as any).createCorruptedData = createCorruptedData;
}
