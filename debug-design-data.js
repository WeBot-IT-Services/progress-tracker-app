/**
 * Debug Script for Design Module Data Loading Issues
 * 
 * Run this in the browser console to debug the Design module data loading
 */

console.log('🔍 Starting Design Module Data Debug...');

// Test the project service directly
async function testProjectService() {
  console.log('\n📊 Testing Project Service...');
  
  try {
    // Import the project service
    const { projectsService } = await import('./src/services/firebaseService.ts');
    
    console.log('✅ Project service imported successfully');
    
    // Get all projects
    const projects = await projectsService.getProjects();
    console.log(`📋 Total projects loaded: ${projects.length}`);
    
    // Log all projects
    projects.forEach((project, index) => {
      console.log(`\n📄 Project ${index + 1}:`, {
        id: project.id,
        name: project.name,
        status: project.status,
        designData: project.designData,
        deliveryDate: project.deliveryDate
      });
    });
    
    // Filter for DNE projects
    const dneProjects = projects.filter(p => p.status === 'dne');
    console.log(`\n🎯 Projects with DNE status: ${dneProjects.length}`);
    
    dneProjects.forEach((project, index) => {
      console.log(`\n🎯 DNE Project ${index + 1}:`, {
        id: project.id,
        name: project.name,
        status: project.status,
        designData: project.designData
      });
    });
    
    // Apply WIP filtering logic
    const wipProjects = projects.filter(project =>
      project.status === 'dne' && 
      project.designData?.status !== 'completed'
    );
    
    console.log(`\n🔧 Projects that should be in WIP: ${wipProjects.length}`);
    
    wipProjects.forEach((project, index) => {
      console.log(`\n🔧 WIP Project ${index + 1}:`, {
        id: project.id,
        name: project.name,
        status: project.status,
        designStatus: project.designData?.status,
        shouldBeInWIP: true
      });
    });
    
    // Apply History filtering logic
    const historyProjects = projects.filter(project =>
      project.designData?.status === 'completed'
    );
    
    console.log(`\n📚 Projects that should be in History: ${historyProjects.length}`);
    
    historyProjects.forEach((project, index) => {
      console.log(`\n📚 History Project ${index + 1}:`, {
        id: project.id,
        name: project.name,
        status: project.status,
        designStatus: project.designData?.status,
        shouldBeInHistory: true
      });
    });
    
    return {
      total: projects.length,
      dne: dneProjects.length,
      wip: wipProjects.length,
      history: historyProjects.length,
      projects: projects
    };
    
  } catch (error) {
    console.error('❌ Error testing project service:', error);
    return { error: error.message };
  }
}

// Test the Design Module component state
async function testDesignModuleState() {
  console.log('\n🎨 Testing Design Module State...');
  
  try {
    // Check if Design Module is mounted and has state
    const designModuleElement = document.querySelector('[data-testid="design-module"]') || 
                               document.querySelector('.design-module') ||
                               document.querySelector('div:has(h1:contains("Design"))');
    
    if (designModuleElement) {
      console.log('✅ Design Module element found in DOM');
    } else {
      console.log('⚠️ Design Module element not found in DOM');
    }
    
    // Check for WIP and History sections
    const wipSection = document.querySelector('[data-testid="wip-section"]') ||
                      document.querySelector('div:has(h2:contains("Work in Progress"))') ||
                      document.querySelector('div:has(h3:contains("WIP"))');
    
    const historySection = document.querySelector('[data-testid="history-section"]') ||
                          document.querySelector('div:has(h2:contains("History"))') ||
                          document.querySelector('div:has(h3:contains("History"))');
    
    console.log('WIP Section found:', !!wipSection);
    console.log('History Section found:', !!historySection);
    
    // Check for project cards
    const projectCards = document.querySelectorAll('[data-testid="project-card"]') ||
                        document.querySelectorAll('.project-card') ||
                        document.querySelectorAll('div:has(.project-name)');
    
    console.log(`Project cards found: ${projectCards.length}`);
    
    return {
      moduleFound: !!designModuleElement,
      wipSectionFound: !!wipSection,
      historySectionFound: !!historySection,
      projectCardsCount: projectCards.length
    };
    
  } catch (error) {
    console.error('❌ Error testing Design Module state:', error);
    return { error: error.message };
  }
}

// Test local storage and development mode
function testEnvironmentSettings() {
  console.log('\n⚙️ Testing Environment Settings...');
  
  const isDevelopment = import.meta.env.DEV;
  const useLocalData = localStorage.getItem('useLocalData');
  const mode = import.meta.env.MODE;
  
  console.log('Development mode:', isDevelopment);
  console.log('Use local data:', useLocalData);
  console.log('Vite mode:', mode);
  console.log('Current URL:', window.location.href);
  
  return {
    isDevelopment,
    useLocalData,
    mode,
    url: window.location.href
  };
}

// Test workflow from Sales to Design
async function testSalesToDesignWorkflow() {
  console.log('\n🔄 Testing Sales to Design Workflow...');
  
  try {
    const { workflowService } = await import('./src/services/workflowService.ts');
    const { projectsService } = await import('./src/services/firebaseService.ts');
    
    console.log('✅ Workflow service imported successfully');
    
    // Create a test project
    const testProjectData = {
      name: 'Debug Test Project',
      description: 'Test project for debugging Design module',
      amount: 100000,
      deliveryDate: '2024-12-31',
      priority: 'high' as const,
      progress: 10,
      createdBy: 'debug-user'
    };
    
    console.log('🔨 Creating test project...');
    const projectId = await projectsService.createProject(testProjectData);
    console.log('✅ Test project created with ID:', projectId);
    
    // Transition to Design
    console.log('🔄 Transitioning project to Design...');
    await workflowService.transitionSalesToDesign(projectId, new Date('2024-12-31'));
    console.log('✅ Project transitioned to Design');
    
    // Verify the project is now in DNE status
    const updatedProject = await projectsService.getProject(projectId);
    console.log('📋 Updated project:', {
      id: updatedProject?.id,
      name: updatedProject?.name,
      status: updatedProject?.status,
      designData: updatedProject?.designData
    });
    
    // Check if it would appear in WIP
    const shouldBeInWIP = updatedProject?.status === 'dne' && 
                         updatedProject?.designData?.status !== 'completed';
    
    console.log('🎯 Should appear in Design WIP:', shouldBeInWIP);
    
    return {
      projectId,
      projectStatus: updatedProject?.status,
      designStatus: updatedProject?.designData?.status,
      shouldBeInWIP
    };
    
  } catch (error) {
    console.error('❌ Error testing Sales to Design workflow:', error);
    return { error: error.message };
  }
}

// Main debug function
async function debugDesignModule() {
  console.log('🔍 Starting comprehensive Design Module debug...\n');
  
  const results = {
    environment: testEnvironmentSettings(),
    projectService: await testProjectService(),
    moduleState: await testDesignModuleState(),
    workflow: await testSalesToDesignWorkflow()
  };
  
  console.log('\n📊 Debug Results Summary:');
  console.log('Environment:', results.environment);
  console.log('Project Service:', results.projectService);
  console.log('Module State:', results.moduleState);
  console.log('Workflow Test:', results.workflow);
  
  // Provide recommendations
  console.log('\n💡 Recommendations:');
  
  if (results.projectService.wip === 0) {
    console.log('⚠️ No projects in WIP - Check if projects have correct status and designData');
  }
  
  if (!results.moduleState.moduleFound) {
    console.log('⚠️ Design Module not found in DOM - Check if component is properly mounted');
  }
  
  if (results.projectService.total === 0) {
    console.log('⚠️ No projects loaded - Check data service and local data');
  }
  
  if (results.environment.useLocalData !== 'true') {
    console.log('💡 Try setting localStorage.setItem("useLocalData", "true") to use local data');
  }
  
  return results;
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.debugDesignModule = debugDesignModule;
  window.testProjectService = testProjectService;
  window.testDesignModuleState = testDesignModuleState;
  window.testSalesToDesignWorkflow = testSalesToDesignWorkflow;
  
  console.log('💡 Available debug functions:');
  console.log('  - window.debugDesignModule() - Run full debug');
  console.log('  - window.testProjectService() - Test project loading');
  console.log('  - window.testDesignModuleState() - Test UI state');
  console.log('  - window.testSalesToDesignWorkflow() - Test workflow');
}

console.log('🔧 Design Module debug script loaded successfully!');
console.log('💡 Run window.debugDesignModule() to start debugging');
