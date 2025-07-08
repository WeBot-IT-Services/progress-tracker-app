import { createAllTestUsers } from './createTestUsers';
import { seedFirebaseData } from './seedData';

// Comprehensive database setup function
export const setupCompleteDatabase = async (): Promise<void> => {
  console.log('🚀 Starting complete database setup...');
  console.log('=====================================');
  
  try {
    // Step 1: Create test user accounts
    console.log('\n📝 Step 1: Creating test user accounts...');
    await createAllTestUsers();
    
    // Wait a moment for user creation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Seed all data
    console.log('\n📝 Step 2: Seeding database with sample data...');
    await seedFirebaseData();
    
    console.log('\n🎉 Complete database setup finished successfully!');
    console.log('================================================');
    console.log('\n🔑 Test Account Credentials:');
    console.log('============================');
    console.log('Admin: admin@mysteel.com / admin123');
    console.log('Sales: sales@mysteel.com / sales123');
    console.log('Designer: designer@mysteel.com / designer123');
    console.log('Production: production@mysteel.com / production123');
    console.log('Installation: installation@mysteel.com / installation123');
    
    console.log('\n📊 Database Collections Created:');
    console.log('================================');
    console.log('✅ users - User profiles and roles');
    console.log('✅ projects - Project data with various statuses');
    console.log('✅ complaints - Customer complaints and issues');
    console.log('✅ milestones - Project milestones and progress');
    console.log('✅ sales - Sales proposals and negotiations');
    console.log('✅ design - Design specifications and approvals');
    console.log('✅ production - Production schedules and status');
    console.log('✅ installation - Installation progress and photos');
    
    console.log('\n🧪 Ready for Testing:');
    console.log('=====================');
    console.log('1. Login with any test account');
    console.log('2. Navigate through role-specific modules');
    console.log('3. Test CRUD operations in each module');
    console.log('4. Verify Master Tracker timeline visualization');
    console.log('5. Test real-time updates across sessions');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

// Quick verification function
export const verifyDatabaseSetup = async (): Promise<void> => {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Import services to check data
    const { projectsService, complaintsService, usersService } = await import('../services/firebaseService');
    
    const [projects, complaints, users] = await Promise.all([
      projectsService.getProjects(),
      complaintsService.getComplaints(),
      usersService.getUsers()
    ]);
    
    console.log('📊 Database Verification Results:');
    console.log('=================================');
    console.log(`✅ Projects: ${projects.length} found`);
    console.log(`✅ Complaints: ${complaints.length} found`);
    console.log(`✅ Users: ${users.length} found`);
    
    if (projects.length > 0 && complaints.length > 0 && users.length > 0) {
      console.log('🎉 Database setup verification successful!');
    } else {
      console.log('⚠️ Some collections appear to be empty. Run setupCompleteDatabase() first.');
    }
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    console.log('💡 Try running setupCompleteDatabase() to initialize the database.');
  }
};

// Reset database function (use with caution)
export const resetDatabase = async (): Promise<void> => {
  console.log('🧹 Database reset functionality...');
  console.log('⚠️ Manual deletion required from Firebase Console');
  console.log('📝 Collections to delete:');
  console.log('   - users');
  console.log('   - projects');
  console.log('   - complaints');
  console.log('   - milestones');
  console.log('   - sales');
  console.log('   - design');
  console.log('   - production');
  console.log('   - installation');
  console.log('\n💡 After manual deletion, run setupCompleteDatabase() to recreate data.');
};

// Make functions available globally for console access
declare global {
  interface Window {
    setupCompleteDatabase: () => Promise<void>;
    verifyDatabaseSetup: () => Promise<void>;
    resetDatabase: () => Promise<void>;
  }
}

// Auto-initialize in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.setupCompleteDatabase = setupCompleteDatabase;
  window.verifyDatabaseSetup = verifyDatabaseSetup;
  window.resetDatabase = resetDatabase;
  
  console.log('🔧 Database Setup Tools Loaded!');
  console.log('===============================');
  console.log('Available commands:');
  console.log('• setupCompleteDatabase() - Complete setup with users and data');
  console.log('• verifyDatabaseSetup() - Check if database is properly set up');
  console.log('• resetDatabase() - Instructions for resetting database');
  console.log('');
  console.log('💡 Quick Start: Run setupCompleteDatabase()');
}
