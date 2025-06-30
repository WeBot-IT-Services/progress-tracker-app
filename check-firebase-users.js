/**
 * Browser Console Script to Check Current Firebase Users
 * 
 * Instructions:
 * 1. Open https://mysteelprojecttracker.web.app
 * 2. Open browser console (F12 → Console)
 * 3. Copy and paste this script
 * 4. Run: checkCurrentUsers()
 */

async function checkCurrentUsers() {
  console.log('🔍 Checking current Firebase Authentication users...');
  
  try {
    // Get Firebase instances
    const { auth, db } = window.firebase || await import('./src/config/firebase.ts');
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js');
    
    // Check Firestore users collection
    console.log('\n📊 Checking Firestore users collection...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore');
      return;
    }
    
    console.log('\n👥 Current Firestore Users:');
    console.log('┌─────────────────────────────┬─────────────┬─────────────────────────┐');
    console.log('│ Email                       │ Role        │ Name                    │');
    console.log('├─────────────────────────────┼─────────────┼─────────────────────────┤');
    
    const users = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({ id: doc.id, ...userData });
      
      const email = (userData.email || 'No email').padEnd(27);
      const role = (userData.role || 'No role').padEnd(11);
      const name = (userData.name || 'No name').padEnd(23);
      
      console.log(`│ ${email} │ ${role} │ ${name} │`);
    });
    
    console.log('└─────────────────────────────┴─────────────┴─────────────────────────┘');
    
    // Check for old domain users
    const oldDomainUsers = users.filter(user => user.email && user.email.includes('mysteer.com'));
    const newDomainUsers = users.filter(user => user.email && user.email.includes('mysteel.com'));
    
    console.log(`\n📈 Summary:`);
    console.log(`• Total users: ${users.length}`);
    console.log(`• Old domain (mysteer.com): ${oldDomainUsers.length}`);
    console.log(`• New domain (mysteel.com): ${newDomainUsers.length}`);
    
    if (oldDomainUsers.length > 0) {
      console.log('\n⚠️ Found users with old mysteer.com domain:');
      oldDomainUsers.forEach(user => {
        console.log(`   • ${user.email} (${user.role})`);
      });
      console.log('\n💡 These users need to be updated to mysteel.com');
    }
    
    if (newDomainUsers.length > 0) {
      console.log('\n✅ Found users with new mysteel.com domain:');
      newDomainUsers.forEach(user => {
        console.log(`   • ${user.email} (${user.role})`);
      });
    }
    
    return { users, oldDomainUsers, newDomainUsers };
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    console.log('\n💡 Make sure you are logged in to the application first');
    return null;
  }
}

// Make function available globally
window.checkCurrentUsers = checkCurrentUsers;

console.log('🔍 Firebase User Checker Script Loaded');
console.log('💡 Run: checkCurrentUsers() to see current users');
