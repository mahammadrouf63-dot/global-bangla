const express = require('express');
const router = express.Router();

const {
  ensureAuthenticated
} = require('../middleware/authMiddleware');
const {
  uploadSubmission,
  uploadProfile
} = require('../middleware/uploadMiddleware');
const {
  getDashboard,
  getCompetitions,
  getCompetition,
  createSubmission,
  getResults,
  getSubmissions,
  updateProfile,
  uploadProfilePicture,
  createPaymentOrder,
  verifyPayment
} = require('../controllers/userController');

const {
  getSiteSettings
} = require('../controllers/adminController');

router.get('/dashboard', ensureAuthenticated, getDashboard);
router.get('/competitions', ensureAuthenticated, getCompetitions);
router.get('/competitions/:id', ensureAuthenticated, getCompetition);
router.get('/results', ensureAuthenticated, getResults);
router.get('/submissions', ensureAuthenticated, getSubmissions);

router.post('/submissions', ensureAuthenticated, uploadSubmission.single('media'), createSubmission);
router.patch('/profile', ensureAuthenticated, updateProfile);
router.post('/profile/picture', ensureAuthenticated, uploadProfile.single('profile'), uploadProfilePicture);

router.post('/payments/order', ensureAuthenticated, createPaymentOrder);
router.post('/payments/verify', ensureAuthenticated, verifyPayment);

// Public competitions endpoint (no authentication required)
router.get('/competitions-public', async (req, res) => {
  try {
    const competitions = await query(
      'SELECT id, title, description, is_paid, fee, whatsapp_link, thumbnail, status, start_date, end_date FROM competitions WHERE status = ? ORDER BY start_date DESC',
      ['active']
    );
    return res.json(competitions);
  } catch (error) {
    console.error('Public competitions error', error);
    return res.status(500).json({ message: 'Unable to fetch competitions.' });
  }
});

// Public site settings endpoint (no authentication required)
router.get('/site-settings', getSiteSettings);

module.exports = router;
