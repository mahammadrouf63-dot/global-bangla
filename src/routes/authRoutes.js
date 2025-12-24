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

const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware'); // <-- path ঠিক করা

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/user/forgot-password', requestUserPasswordReset);
router.post('/admin/forgot-password', requestAdminPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/admin/create', createAdminAccount);

module.exports = router;
