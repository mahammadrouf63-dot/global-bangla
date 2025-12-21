const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('Connecting to MySQL...');
    
    // Connect without database first to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Creating database global_bangla...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS global_bangla');
    console.log('Database created successfully!');

    await connection.end();

    // Now connect to the database and run schema
    console.log('Connecting to global_bangla database...');
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'global_bangla',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('Running schema.sql...');
    const schema = fs.readFileSync('./src/config/schema.sql', 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }
    
    console.log('Database setup completed successfully!');
    await pool.end();
    
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
