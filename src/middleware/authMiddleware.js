const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  requestUserPasswordReset,
  requestAdminPasswordReset,
  resetPassword,
  createAdminAccount
} = require('../controllers/authController');

const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware'); // <-- ঠিক করা হলো

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout); // Clears JWT cookie
router.post('/user/forgot-password', requestUserPasswordReset);
router.post('/admin/forgot-password', requestAdminPasswordReset);
router.post('/reset-password', resetPassword);

// Admin creation protected by invite code only (already handled in controller)
router.post('/admin/create', createAdminAccount);

// Example of protected route usage:
// router.get('/profile', ensureAuthenticated, (req, res) => {
//   res.json({ user: req.user }); 
// });

module.exports = router;
