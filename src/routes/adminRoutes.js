const express = require('express');
const {
  ensureAuthenticated,
  ensureAdmin
} = require('../middleware/authMiddleware');
const {
  uploadCompetition,
  uploadWinner,
  uploadLogo
} = require('../middleware/uploadMiddleware');
const {
  getAdminDashboard,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getCompetitions,
  listSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
  addWinner,
  removeWinner,
  listWinners,
  updateSiteSettings,
  getSiteSettings,
  toggleFeature,
  listStudents,
  getPayments
} = require('../controllers/adminController');

const router = express.Router();

const adminGuard = [ensureAuthenticated, ensureAdmin];

router.get('/dashboard', adminGuard, getAdminDashboard);
router.get('/competitions', adminGuard, getCompetitions);

router.post('/competitions', adminGuard, uploadCompetition.single('thumbnail'), createCompetition);
router.patch('/competitions/:id', adminGuard, uploadCompetition.single('thumbnail'), updateCompetition);
router.delete('/competitions/:id', adminGuard, deleteCompetition);

router.get('/submissions', adminGuard, listSubmissions);
router.patch('/submissions/:id', adminGuard, updateSubmissionStatus);
router.delete('/submissions/:id', adminGuard, deleteSubmission);

router.post('/winners', adminGuard, uploadWinner.single('media'), addWinner);
router.delete('/winners/:id', adminGuard, removeWinner);
router.get('/winners', adminGuard, listWinners);

router.patch('/settings', adminGuard, uploadLogo.single('logo'), updateSiteSettings);
router.get('/settings', adminGuard, getSiteSettings);
router.post('/features/toggle', adminGuard, toggleFeature);

router.get('/students', adminGuard, listStudents);
router.get('/payments', adminGuard, getPayments);

module.exports = router;
