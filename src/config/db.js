require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('Database config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),   // 🔴 MUST

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,

  connectTimeout: 20000,               // 🔴 MUST (20 sec)

  ssl: {
    rejectUnauthorized: false          // 🔴 MUST for Railway
  }
});

// warm connection (VERY IMPORTANT)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB CONNECTED & WARM");
    conn.release();
  } catch (err) {
    console.error("❌ DB CONNECTION FAILED:", err.message);
  }
})();

module.exports = pool;
