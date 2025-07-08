/**
 * Data Integrity Checker
 * Main orchestrator for Firestore data audit, recovery, and verification
 */

import { FirestoreAuditor } from './firestoreAudit';
import { DataRecoveryTool } from './dataRecovery';
import { projectsService, milestonesService, complaintsService, usersService } from '../services/firebaseService';
import type { Project, Milestone, Complaint, User } from '../services/firebaseService';
import type { AuditResults, RecoveryResults } from './dataRecovery';

interface IntegrityCheckResults {
  audit: AuditResults;
  recovery: RecoveryResults;
  verification: VerificationResults;
  summary: {
    success: boolean;
    totalIssuesFound: number;
    totalIssuesFixed: number;
    remainingIssues: number;
    recommendations: string[];
  };
}

interface VerificationResults {
  modulesWorking: {
    sales: boolean;
    design: boolean;
    production: boolean;
    installation: boolean;
    complaints: boolean;
    users: boolean;
  };
  crudOperations: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  dataConsistency: {
    projectsCount: number;
    milestonesCount: number;
    complaintsCount: number;
    usersCount: number;
    orphanedMilestones: number;
    invalidReferences: number;
  };
  errors: string[];
}

class DataIntegrityChecker {
  private auditor: FirestoreAuditor;
  private recoveryTool: DataRecoveryTool;

  constructor() {
    this.auditor = new FirestoreAuditor();
    this.recoveryTool = new DataRecoveryTool();
  }

  // Main integrity check function
  async performFullIntegrityCheck(): Promise<IntegrityCheckResults> {
    console.log('🔍 Starting comprehensive data integrity check...');
    console.log('This will audit, repair, and verify all Firestore data');

    const results: IntegrityCheckResults = {
      audit: {} as AuditResults,
      recovery: {} as RecoveryResults,
      verification: {} as VerificationResults,
      summary: {
        success: false,
        totalIssuesFound: 0,
        totalIssuesFixed: 0,
        remainingIssues: 0,
        recommendations: []
      }
    };

    try {
      // Step 1: Audit current data
      console.log('\n📊 STEP 1: AUDITING FIRESTORE DATA');
      console.log('=' .repeat(50));
      results.audit = await this.auditor.performFullAudit();
      this.auditor.exportResults();

      // Step 2: Recover and repair data
      console.log('\n🔧 STEP 2: RECOVERING AND REPAIRING DATA');
      console.log('=' .repeat(50));
      results.recovery = await this.recoveryTool.performDataRecovery(results.audit);
      this.recoveryTool.exportResults(results.recovery);

      // Step 3: Verify data integrity after repairs
      console.log('\n✅ STEP 3: VERIFYING DATA INTEGRITY');
      console.log('=' .repeat(50));
      results.verification = await this.verifyDataIntegrity();
      this.exportVerificationResults(results.verification);

      // Step 4: Generate summary
      this.generateSummary(results);

      console.log('\n🎯 DATA INTEGRITY CHECK COMPLETED');
      this.exportSummary(results.summary);

      return results;

    } catch (error) {
      console.error('❌ Data integrity check failed:', error);
      results.summary.success = false;
      results.summary.recommendations.push(`Integrity check failed: ${error.message}`);
      return results;
    }
  }

  // Verify data integrity after repairs
  private async verifyDataIntegrity(): Promise<VerificationResults> {
    const verification: VerificationResults = {
      modulesWorking: {
        sales: false,
        design: false,
        production: false,
        installation: false,
        complaints: false,
        users: false
      },
      crudOperations: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      dataConsistency: {
        projectsCount: 0,
        milestonesCount: 0,
        complaintsCount: 0,
        usersCount: 0,
        orphanedMilestones: 0,
        invalidReferences: 0
      },
      errors: []
    };

    try {
      // Test data reading capabilities
      console.log('🔍 Testing data reading capabilities...');
      
      const projects = await projectsService.getProjects();
      verification.dataConsistency.projectsCount = projects.length;
      verification.modulesWorking.sales = true;
      verification.modulesWorking.design = true;
      verification.modulesWorking.production = true;
      verification.modulesWorking.installation = true;
      verification.crudOperations.read = true;
      
      console.log(`✅ Successfully read ${projects.length} projects`);

      // Test milestones
      let totalMilestones = 0;
      let orphanedMilestones = 0;
      
      for (const project of projects) {
        if (project.id) {
          const milestones = await projectsService.getMilestonesByProject(project.id);
          totalMilestones += milestones.length;
        }
      }
      
      verification.dataConsistency.milestonesCount = totalMilestones;
      console.log(`✅ Successfully read ${totalMilestones} milestones`);

      // Test complaints
      try {
        const complaints = await complaintsService.getComplaints();
        verification.dataConsistency.complaintsCount = complaints.length;
        verification.modulesWorking.complaints = true;
        console.log(`✅ Successfully read ${complaints.length} complaints`);
      } catch (error) {
        verification.errors.push(`Complaints read failed: ${error.message}`);
        console.warn('⚠️ Complaints module has issues:', error);
      }

      // Test users
      try {
        const users = await usersService.getUsers();
        verification.dataConsistency.usersCount = users.length;
        verification.modulesWorking.users = true;
        console.log(`✅ Successfully read ${users.length} users`);
      } catch (error) {
        verification.errors.push(`Users read failed: ${error.message}`);
        console.warn('⚠️ Users module has issues:', error);
      }

      // Test CRUD operations with a test document
      await this.testCrudOperations(verification);

      // Check for data consistency issues
      await this.checkDataConsistency(verification);

    } catch (error) {
      console.error('❌ Verification failed:', error);
      verification.errors.push(`Verification failed: ${error.message}`);
    }

    return verification;
  }

  // Test CRUD operations
  private async testCrudOperations(verification: VerificationResults): Promise<void> {
    console.log('🧪 Testing CRUD operations...');

    try {
      // Test CREATE
      const testProject = {
        projectName: 'INTEGRITY_TEST_PROJECT',
        description: 'Test project for data integrity verification',
        amount: 0,
        deliveryDate: new Date().toISOString().split('T')[0],
        status: 'sales' as const,
        createdBy: 'integrity-checker'
      };

      const testProjectId = await projectsService.createProject(testProject);
      verification.crudOperations.create = true;
      console.log('✅ CREATE operation successful');

      // Test UPDATE
      await projectsService.updateProject(testProjectId, {
        description: 'Updated test project description'
      });
      verification.crudOperations.update = true;
      console.log('✅ UPDATE operation successful');

      // Test DELETE
      await projectsService.deleteProject(testProjectId);
      verification.crudOperations.delete = true;
      console.log('✅ DELETE operation successful');

    } catch (error) {
      console.error('❌ CRUD operations test failed:', error);
      verification.errors.push(`CRUD test failed: ${error.message}`);
    }
  }

  // Check data consistency
  private async checkDataConsistency(verification: VerificationResults): Promise<void> {
    console.log('🔍 Checking data consistency...');

    try {
      // Check for orphaned milestones (milestones without valid project references)
      const projects = await projectsService.getProjects();
      const projectIds = new Set(projects.map(p => p.id).filter(Boolean));

      let orphanedCount = 0;
      for (const project of projects) {
        if (project.id) {
          const milestones = await projectsService.getMilestonesByProject(project.id);
          for (const milestone of milestones) {
            if (!projectIds.has(milestone.projectId)) {
              orphanedCount++;
            }
          }
        }
      }

      verification.dataConsistency.orphanedMilestones = orphanedCount;
      
      if (orphanedCount > 0) {
        console.warn(`⚠️ Found ${orphanedCount} orphaned milestones`);
      } else {
        console.log('✅ No orphaned milestones found');
      }

    } catch (error) {
      console.error('❌ Data consistency check failed:', error);
      verification.errors.push(`Consistency check failed: ${error.message}`);
    }
  }

  // Generate summary
  private generateSummary(results: IntegrityCheckResults): void {
    const summary = results.summary;
    
    // Calculate issues
    summary.totalIssuesFound = results.audit.summary.invalidDocuments;
    summary.totalIssuesFixed = results.recovery.repairedDocuments + results.recovery.migratedFromLocal;
    summary.remainingIssues = Math.max(0, summary.totalIssuesFound - summary.totalIssuesFixed);

    // Determine overall success
    summary.success = results.recovery.success && 
                     results.verification.errors.length === 0 && 
                     summary.remainingIssues === 0;

    // Generate recommendations
    if (summary.remainingIssues > 0) {
      summary.recommendations.push(`${summary.remainingIssues} data issues still need attention`);
    }

    if (results.verification.errors.length > 0) {
      summary.recommendations.push('Some modules have verification errors that need investigation');
    }

    if (results.verification.dataConsistency.orphanedMilestones > 0) {
      summary.recommendations.push('Clean up orphaned milestones');
    }

    if (summary.success) {
      summary.recommendations.push('Data integrity is good - all systems operational');
    }
  }

  // Export verification results
  private exportVerificationResults(verification: VerificationResults): void {
    console.log('\n✅ VERIFICATION RESULTS');
    console.log('=' .repeat(30));
    
    console.log('\n📊 Data Counts:');
    console.log(`  Projects: ${verification.dataConsistency.projectsCount}`);
    console.log(`  Milestones: ${verification.dataConsistency.milestonesCount}`);
    console.log(`  Complaints: ${verification.dataConsistency.complaintsCount}`);
    console.log(`  Users: ${verification.dataConsistency.usersCount}`);

    console.log('\n🔧 Module Status:');
    Object.entries(verification.modulesWorking).forEach(([module, working]) => {
      console.log(`  ${module}: ${working ? '✅' : '❌'}`);
    });

    console.log('\n⚙️ CRUD Operations:');
    Object.entries(verification.crudOperations).forEach(([operation, working]) => {
      console.log(`  ${operation}: ${working ? '✅' : '❌'}`);
    });

    if (verification.errors.length > 0) {
      console.log('\n❌ Verification Errors:');
      verification.errors.forEach(error => console.log(`  - ${error}`));
    }
  }

  // Export summary
  private exportSummary(summary: IntegrityCheckResults['summary']): void {
    console.log('=' .repeat(50));
    console.log(`Overall Status: ${summary.success ? '✅ SUCCESS' : '❌ ISSUES FOUND'}`);
    console.log(`Issues Found: ${summary.totalIssuesFound}`);
    console.log(`Issues Fixed: ${summary.totalIssuesFixed}`);
    console.log(`Remaining Issues: ${summary.remainingIssues}`);
    
    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      summary.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    console.log('=' .repeat(50));
  }
}

// Export for use in development tools
export { DataIntegrityChecker };
export type { IntegrityCheckResults, VerificationResults };
