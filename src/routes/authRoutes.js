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

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/user/forgot-password', requestUserPasswordReset);
router.post('/admin/reset-password', requestAdminPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/admin/create', createAdminAccount);

module.exports = router;
