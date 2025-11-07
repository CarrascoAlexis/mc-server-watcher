require('dotenv').config();
const authManager = require('./auth');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function initializeAdmin() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Initialize Admin User                 ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Check if users file exists
  const users = await authManager.loadUsers();
  
  if (users.length > 0) {
    console.log('⚠️  Users already exist in the system.');
    rl.question('Do you want to create another admin user? (y/n): ', async (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log('Initialization cancelled.');
        rl.close();
        return;
      }
      await createAdmin();
    });
  } else {
    await createAdmin();
  }
}

async function createAdmin() {
  rl.question('Admin username: ', (username) => {
    rl.question('Admin password: ', async (password) => {
      try {
        const hashedPassword = await authManager.hashPassword(password);
        
        const adminUser = {
          id: 'admin-' + Date.now(),
          username,
          password: hashedPassword,
          role: 'admin',
          terminals: ['minecraft-server'], // Access to all terminals by default
          createdAt: new Date().toISOString()
        };

        const users = await authManager.loadUsers();
        users.push(adminUser);
        await authManager.saveUsers(users);

        console.log('\n✅ Admin user created successfully!');
        console.log(`   Username: ${username}`);
        console.log(`   Role: admin`);
        console.log(`   Access: All terminals\n`);
        
        rl.close();
      } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        rl.close();
      }
    });
  });
}

initializeAdmin();
