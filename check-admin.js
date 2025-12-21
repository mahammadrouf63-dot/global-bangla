const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdminAccounts() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'global_bangla'
    });

    const [adminAccounts] = await connection.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE role = "admin"'
    );

    console.log('Admin Accounts:');
    if (adminAccounts.length === 0) {
      console.log('No admin accounts found.');
    } else {
      adminAccounts.forEach(admin => {
        console.log(`- ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}, Created: ${admin.created_at}`);
      });
    }

    console.log(`\nAdmin Invite Code: ${process.env.ADMIN_INVITE_CODE}`);
    
    await connection.end();
  } catch (error) {
    console.error('Error checking admin accounts:', error);
  }
}

checkAdminAccounts();
