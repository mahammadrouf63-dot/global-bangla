## Global Bangla Competition Platform

Full-stack Node.js + MySQL application that powers a student competition portal along with an admin console.

### Tech
- Backend: Express, MySQL, express-session, multer, Razorpay, Nodemailer
- Frontend: HTML/CSS/JavaScript (separate `/user-site` and `/admin-site`)

### Getting Started
1. Install dependencies
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and update credentials:
   ```bash
   cp .env.example .env
   ```
3. Initialize database
   ```bash
   mysql -u <user> -p < database < src/config/schema.sql
   ```
4. Start server
   ```bash
   npm run dev
   ```
5. Access
   - Student site: `http://localhost:5000/`
   - Admin site: `http://localhost:5000/admin/`

### Credentials
- Create at least one admin user manually:
  ```sql
  INSERT INTO users (name, email, password_hash, role)
  VALUES ('Admin', 'admin@example.com', '<bcrypt_hash>', 'admin');
  ```
