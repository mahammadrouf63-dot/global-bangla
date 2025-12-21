const crypto = require('crypto');
const { query } = require('../utils/query');
const razorpay = require('../utils/razorpay');

const getDashboard = async (req, res) => {
  try {
    const studentId = req.session.user.id;

    const profileResult = await query(
      `SELECT name, email, school, affiliate_school, profile_picture
       FROM users WHERE id = ?`,
      [studentId]
    );
    
    const profile = profileResult[0];

    const competitions = await query(
      `SELECT id, title, status, is_paid, fee, thumbnail, description, start_date, end_date FROM competitions
       WHERE status = 'active'
       ORDER BY start_date DESC`
    );

    const submissions = await query(
      `SELECT s.id, c.title AS competition, s.status, s.created_at
       FROM submissions s
       JOIN competitions c ON c.id = s.competition_id
       WHERE s.student_id = ?
       ORDER BY s.created_at DESC`,
      [studentId]
    );

    const winners = await query(
      `SELECT w.id, w.student_name, w.media_path, c.title AS competition
       FROM winners w
       LEFT JOIN competitions c ON c.id = w.competition_id
       ORDER BY w.created_at DESC LIMIT 6`
    );

    const settingsResult = await query('SELECT logo_path, affiliate_text, about_content, features FROM site_settings WHERE id = 1');
    const settings = settingsResult[0];

    return res.json({
      profile,
      competitions,
      submissions,
      winners,
      settings
    });
  } catch (error) {
    console.error('Dashboard error', error);
    return res.status(500).json({ message: 'Unable to load dashboard.' });
  }
};

const getCompetitions = async (_req, res) => {
  try {
    const competitions = await query(
      `SELECT id, title, description, is_paid, fee, whatsapp_link, thumbnail,
              status, start_date, end_date
       FROM competitions
       WHERE status = 'active'
       ORDER BY start_date DESC`
    );
    return res.json(competitions);
  } catch (error) {
    console.error('Competitions error', error);
    return res.status(500).json({ message: 'Unable to fetch competitions.' });
  }
};

const getCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const [competition] = await query(
      `SELECT id, title, description, is_paid, fee, whatsapp_link,
              thumbnail, status, start_date, end_date
       FROM competitions WHERE id = ?`,
      [id]
    );

    if (!competition) return res.status(404).json({ message: 'Competition not found.' });
    return res.json(competition);
  } catch (error) {
    console.error('Competition detail error', error);
    return res.status(500).json({ message: 'Unable to load competition.' });
  }
};

const createSubmission = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const { competitionId, notes } = req.body;
    const mediaPath = req.file ? `/uploads/submissions/${req.file.filename}` : null;

    const [competition] = await query('SELECT id, whatsapp_link FROM competitions WHERE id = ?', [competitionId]);
    if (!competition) return res.status(404).json({ message: 'Competition not found.' });

    await query(
      `INSERT INTO submissions (student_id, competition_id, media_path, notes)
       VALUES (?, ?, ?, ?)`,
      [studentId, competitionId, mediaPath, notes || null]
    );

    return res.status(201).json({
      message: 'Submission received.',
      whatsappLink: competition.whatsapp_link
    });
  } catch (error) {
    console.error('Submission error', error);
    return res.status(500).json({ message: 'Unable to submit entry.' });
  }
};

const getResults = async (_req, res) => {
  try {
    const winners = await query(
      `SELECT w.id, w.student_name, w.school, w.media_path, w.highlight_text,
              c.title AS competition
       FROM winners w
       LEFT JOIN competitions c ON c.id = w.competition_id
       ORDER BY w.created_at DESC`
    );
    return res.json(winners);
  } catch (error) {
    console.error('Results error', error);
    return res.status(500).json({ message: 'Unable to load winners.' });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const submissions = await query(
      `SELECT s.id, c.title AS competition, s.status, s.media_path, s.created_at
       FROM submissions s
       JOIN competitions c ON c.id = s.competition_id
       WHERE s.student_id = ?
       ORDER BY s.created_at DESC`,
      [studentId]
    );
    return res.json(submissions);
  } catch (error) {
    console.error('List submission error', error);
    return res.status(500).json({ message: 'Unable to fetch submissions.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const { name, school, affiliateSchool } = req.body;

    await query(
      `UPDATE users
       SET name = COALESCE(?, name),
           school = COALESCE(?, school),
           affiliate_school = COALESCE(?, affiliate_school)
       WHERE id = ?`,
      [name || null, school || null, affiliateSchool || null, studentId]
    );

    return res.json({ message: 'Profile updated.' });
  } catch (error) {
    console.error('Profile update error', error);
    return res.status(500).json({ message: 'Unable to update profile.' });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const studentId = req.session.user.id;
    const profilePath = `/uploads/profiles/${req.file.filename}`;
    await query('UPDATE users SET profile_picture = ? WHERE id = ?', [profilePath, studentId]);
    return res.json({ message: 'Profile picture updated.', profilePath });
  } catch (error) {
    console.error('Profile picture error', error);
    return res.status(500).json({ message: 'Unable to upload profile picture.' });
  }
};

const createPaymentOrder = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const { competitionId } = req.body;

    const [competition] = await query('SELECT id, title, fee, is_paid FROM competitions WHERE id = ?', [competitionId]);
    if (!competition) return res.status(404).json({ message: 'Competition not found.' });
    if (!competition.is_paid) return res.status(400).json({ message: 'Competition is free.' });

    const amount = Math.round(Number(competition.fee) * 100);
    
    // Check if Razorpay is properly configured
    if (!razorpay) {
      console.error('Razorpay not initialized - payment service unavailable');
      return res.status(500).json({ message: 'Payment service not configured properly.' });
    }
    
    try {
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `GB-${competitionId}-${Date.now()}`
      });

      await query(
        `INSERT INTO payments (order_id, student_id, competition_id, amount)
         VALUES (?, ?, ?, ?)`,
        [order.id, studentId, competitionId, amount / 100]
      );

      return res.json({ orderId: order.id, amount, currency: order.currency });
    } catch (razorpayError) {
      console.error('Razorpay API error:', razorpayError);
      if (razorpayError.statusCode === 401) {
        return res.status(500).json({ message: 'Payment service authentication failed. Please check Razorpay credentials.' });
      }
      return res.status(500).json({ message: 'Payment service temporarily unavailable.' });
    }
  } catch (error) {
    console.error('Create order error', error);
    return res.status(500).json({ message: 'Unable to create payment order.' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Incomplete payment details.' });
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body).digest('hex');

    const status = expectedSignature === signature ? 'paid' : 'failed';

    await query(
      `UPDATE payments SET payment_id = ?, signature = ?, status = ?
       WHERE order_id = ?`,
      [paymentId, signature, status, orderId]
    );

    if (status === 'paid') {
      return res.json({ message: 'Payment verified.' });
    }
    return res.status(400).json({ message: 'Payment verification failed.' });
  } catch (error) {
    console.error('Verify payment error', error);
    return res.status(500).json({ message: 'Unable to verify payment.' });
  }
};

module.exports = {
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
};
