const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createAdminAccount() {
  const adminData = {
    name: 'Admin User',
    email: 'admin@globalbangla.com',
    password: 'admin123',
    inviteCode: 'globalbangla12'
  };

  try {
    const response = await fetch('http://localhost:5000/api/auth/admin/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin account created successfully!');
      console.log(`Email: ${adminData.email}`);
      console.log(`Password: ${adminData.password}`);
      console.log(`Admin ID: ${result.adminId}`);
    } else {
      console.error('❌ Failed to create admin account:', result.message);
    }
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
  }
}

createAdminAccount();
