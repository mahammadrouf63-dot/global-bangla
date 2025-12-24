// controllers/authController.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/query');
const { sendMail } = require('../utils/mailer');

// Helper: create password reset token
const createResetRecord = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  await query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), expires_at = VALUES(expires_at)`,
    [user.id, tokenHash, expiresAt]
  );

  return token;
};

// Signup (Student)
const signup = async (req, res) => {
  try {
    const { name, email, password, school, affiliateSchool } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, school, affiliate_school)
       VALUES (?, ?, ?, 'student', ?, ?)`,
      [name, email, passwordHash, school || null, affiliateSchool || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, role: 'student', name, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send token in cookie
    res.cookie('gb_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ message: 'Signup successful', token });
  } catch (error) {
    console.error('Signup error', error);
    return res.status(500).json({ message: 'Unable to sign up right now.' });
  }
};

// Login (Student/Admin)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const [user] = await query('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send token in cookie
    res.cookie('gb_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Unable to login right now.' });
  }
};

// Logout
const logout = async (req, res) => {
  res.clearCookie('gb_token');
  return res.json({ message: 'Logged out' });
};

// Create Admin
const createAdminAccount = async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;
    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!process.env.ADMIN_INVITE_CODE || inviteCode !== process.env.ADMIN_INVITE_CODE) {
      return res.status(403).json({ message: 'Invalid invite code.' });
    }

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const adminCount = await query('SELECT COUNT(*) as total FROM users WHERE role = "admin"');
    if (Number(adminCount?.[0]?.total || 0) >= 5) {
      return res.status(403).json({ message: 'Admin limit reached. Contact support.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')`,
      [name, email, passwordHash]
    );

    return res.status(201).json({
      message: 'Admin account created. You can login now.',
      adminId: result.insertId
    });
  } catch (error) {
    console.error('Create admin error', error);
    return res.status(500).json({ message: 'Unable to create admin right now.' });
  }
};

// Request Student Password Reset
const requestUserPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [user] = await query('SELECT id, name FROM users WHERE email = ? AND role = "student"', [email]);
    if (!user) return res.status(404).json({ message: 'Student not found.' });

    const token = await createResetRecord(user);
    const resetLink = `${process.env.BASE_URL}/user-site/reset.html?token=${token}`;

    await sendMail({
      to: email,
      subject: 'Global Bangla Password Reset',
      html: `<p>Hello ${user.name},</p>
             <p>Use the link below to reset your password. It expires in 30 minutes.</p>
             <p><a href="${resetLink}">${resetLink}</a></p>`
    });

    return res.json({ message: 'Password reset link sent.' });
  } catch (error) {
    console.error('User reset error', error);
    return res.status(500).json({ message: 'Unable to process reset request.' });
  }
};

// Request Admin Password Reset
const requestAdminPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [admin] = await query('SELECT id, name FROM users WHERE email = ? AND role = "admin"', [email]);
    if (!admin) return res.status(404).json({ message: 'Admin account not found.' });

    const token = await createResetRecord(admin);
    const resetLink = `${process.env.BASE_URL}/admin-site/reset.html?token=${token}`;

    await sendMail({
      to: email,
      subject: 'Global Bangla Admin Password Reset',
      html: `<p>Hello ${admin.name},</p>
             <p>Reset your admin password within 30 minutes using the link below:</p>
             <p><a href="${resetLink}">${resetLink}</a></p>`
    });

    return res.json({ message: 'Admin reset link sent.' });
  } catch (error) {
    console.error('Admin reset error', error);
    return res.status(500).json({ message: 'Unable to process admin reset.' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [resetRecord] = await query(
      `SELECT pr.user_id, u.email FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = ? AND pr.expires_at > NOW()`,
      [tokenHash]
    );

    if (!resetRecord) return res.status(400).json({ message: 'Invalid or expired token.' });

    const passwordHash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, resetRecord.user_id]);
    await query('DELETE FROM password_resets WHERE user_id = ?', [resetRecord.user_id]);

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error', error);
    return res.status(500).json({ message: 'Unable to reset password.' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  createAdminAccount,
  requestUserPasswordReset,
  requestAdminPasswordReset,
  resetPassword
};
