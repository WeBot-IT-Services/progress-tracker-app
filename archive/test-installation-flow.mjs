import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf_CuTroqtn2OQs",
  authDomain: "progress-tracker-app-d8b76.firebaseapp.com",
  projectId: "progress-tracker-app-d8b76",
  storageBucket: "progress-tracker-app-d8b76.firebasestorage.app",
  messagingSenderId: "1092527848623",
  appId: "1:1092527848623:web:a6b7fb177917d1e2b7fb3c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testInstallationFlow() {
  console.log('🔍 Testing Installation Flow...');
  
  try {
    // 1. Get all projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    console.log(`📊 Total projects: ${projectsSnapshot.size}`);
    
    // 2. Find projects in DNE status
    const dneProjects = [];
    projectsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'dne') {
        dneProjects.push({ id: doc.id, ...data });
        console.log(`📋 DNE Project: ${data.projectName || data.name} (${doc.id})`);
        console.log(`   Design Status: ${data.designData?.status || 'undefined'}`);
      }
    });
    
    if (dneProjects.length === 0) {
      console.log('❌ No projects in DNE status found');
      return;
    }
    
    // 3. Test transitioning one project to installation
    const testProject = dneProjects[0];
    console.log(`🧪 Testing transition for project: ${testProject.projectName || testProject.name}`);
    
    // Simulate the workflow transition
    const updates = {
      status: 'installation',
      progress: 75,
      designData: {
        ...testProject.designData,
        status: 'completed',
        completedAt: new Date(),
        deliveryDate: new Date(),
        lastModified: new Date()
      },
      installationData: {
        milestoneProgress: {},
        lastModified: new Date()
      },
      updatedAt: new Date()
    };
    
    console.log('📝 Updating project with installation status...');
    await updateDoc(doc(db, 'projects', testProject.id), updates);
    
    // 4. Verify the update
    const updatedSnapshot = await getDocs(collection(db, 'projects'));
    let installationProjects = 0;
    updatedSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'installation') {
        installationProjects++;
        console.log(`✅ Installation Project: ${data.projectName || data.name} (${doc.id})`);
      }
    });
    
    console.log(`📊 Projects in installation status: ${installationProjects}`);
    
    if (installationProjects > 0) {
      console.log('✅ Installation flow test PASSED - Project successfully transitioned');
    } else {
      console.log('❌ Installation flow test FAILED - No projects in installation status');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testInstallationFlow();
