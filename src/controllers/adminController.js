const { query } = require('../utils/query');

const getAdminDashboard = async (_req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
        (SELECT COUNT(*) FROM competitions) AS competitions,
        (SELECT COUNT(*) FROM submissions) AS submissions,
        (SELECT COUNT(*) FROM payments WHERE status = 'paid') AS paid_orders
    `);

    const latestSubmissions = await query(
      `SELECT s.id, u.name, c.title AS competition, s.status, s.created_at
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       JOIN competitions c ON c.id = s.competition_id
       ORDER BY s.created_at DESC LIMIT 10`
    );

    const winners = await query(
      `SELECT w.id, w.student_name, c.title AS competition, w.media_path
       FROM winners w
       LEFT JOIN competitions c ON c.id = w.competition_id
       ORDER BY w.created_at DESC LIMIT 6`
    );

    return res.json({ stats: stats[0], latestSubmissions, winners });
  } catch (error) {
    console.error('Admin dashboard error', error);
    return res.status(500).json({ message: 'Unable to load dashboard.' });
  }
};

const createCompetition = async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const {
      title,
      description,
      isPaid,
      fee,
      whatsappLink,
      status,
      startDate,
      endDate
    } = req.body;

    const thumbnail = req.file ? `/uploads/competitions/${req.file.filename}` : null;

    await query(
      `INSERT INTO competitions
      (title, description, is_paid, fee, whatsapp_link, status, start_date, end_date, thumbnail, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        isPaid === 'true' || isPaid === true,
        fee || 0,
        whatsappLink,
        status || 'draft',
        startDate || null,
        endDate || null,
        thumbnail,
        adminId
      ]
    );

    return res.status(201).json({ message: 'Competition created.' });
  } catch (error) {
    console.error('Create competition error', error);
    return res.status(500).json({ message: 'Unable to create competition.' });
  }
};

const updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const params = [
      fields.title ?? null,
      fields.description ?? null,
      typeof fields.is_paid === 'undefined' ? null : fields.is_paid,
      fields.fee ?? null,
      fields.whatsapp_link ?? null,
      fields.status ?? null,
      fields.start_date ?? null,
      fields.end_date ?? null
    ];

    let thumbnailClause = '';
    if (req.file) {
      thumbnailClause = ', thumbnail = ?';
      params.push(`/uploads/competitions/${req.file.filename}`);
    }

    params.push(id);

    await query(
      `UPDATE competitions
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           is_paid = COALESCE(?, is_paid),
           fee = COALESCE(?, fee),
           whatsapp_link = COALESCE(?, whatsapp_link),
           status = COALESCE(?, status),
           start_date = COALESCE(?, start_date),
           end_date = COALESCE(?, end_date)
           ${thumbnailClause}
       WHERE id = ?`,
      params
    );

    return res.json({ message: 'Competition updated.' });
  } catch (error) {
    console.error('Update competition error', error);
    return res.status(500).json({ message: 'Unable to update competition.' });
  }
};

const deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM competitions WHERE id = ?', [id]);
    return res.json({ message: 'Competition removed.' });
  } catch (error) {
    console.error('Delete competition error', error);
    return res.status(500).json({ message: 'Unable to delete competition.' });
  }
};

const getCompetitions = async (_req, res) => {
  try {
    const competitions = await query(
      `SELECT id, title, description, is_paid, fee, whatsapp_link, status,
              start_date, end_date, thumbnail
       FROM competitions
       ORDER BY created_at DESC`
    );
    return res.json(competitions);
  } catch (error) {
    console.error('Admin competitions error', error);
    return res.status(500).json({ message: 'Unable to load competitions.' });
  }
};

const listSubmissions = async (_req, res) => {
  try {
    const submissions = await query(
      `SELECT s.id, u.name, u.email, c.title AS competition, s.status, s.media_path, s.created_at
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       JOIN competitions c ON c.id = s.competition_id
       ORDER BY s.created_at DESC`
    );
    return res.json(submissions);
  } catch (error) {
    console.error('List submissions error', error);
    return res.status(500).json({ message: 'Unable to load submissions.' });
  }
};

const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await query('UPDATE submissions SET status = ? WHERE id = ?', [status, id]);
    return res.json({ message: 'Submission updated.' });
  } catch (error) {
    console.error('Submission status error', error);
    return res.status(500).json({ message: 'Unable to update submission.' });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM submissions WHERE id = ?', [id]);
    return res.json({ message: 'Submission deleted.' });
  } catch (error) {
    console.error('Delete submission error', error);
    return res.status(500).json({ message: 'Unable to delete submission.' });
  }
};

const addWinner = async (req, res) => {
  try {
    const { competitionId, studentName, school, highlightText } = req.body;
    const mediaPath = req.file ? `/uploads/winners/${req.file.filename}` : null;

    await query(
      `INSERT INTO winners (competition_id, student_name, school, media_path, highlight_text)
       VALUES (?, ?, ?, ?, ?)`,
      [competitionId || null, studentName, school, mediaPath, highlightText]
    );

    return res.status(201).json({ message: 'Winner added.' });
  } catch (error) {
    console.error('Add winner error', error);
    return res.status(500).json({ message: 'Unable to add winner.' });
  }
};

const removeWinner = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM winners WHERE id = ?', [id]);
    return res.json({ message: 'Winner removed.' });
  } catch (error) {
    console.error('Remove winner error', error);
    return res.status(500).json({ message: 'Unable to remove winner.' });
  }
};

const listWinners = async (_req, res) => {
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
    console.error('List winners error', error);
    return res.status(500).json({ message: 'Unable to load winners.' });
  }
};

const updateSiteSettings = async (req, res) => {
  try {
    const { affiliateText, aboutContent, features } = req.body;
    const params = [
      affiliateText ?? null,
      aboutContent ?? null,
      features ? JSON.stringify(features) : null
    ];

    let logoClause = '';
    if (req.file) {
      logoClause = ', logo_path = ?';
      params.push(`/uploads/logos/${req.file.filename}`);
    }

    await query(
      `UPDATE site_settings
       SET affiliate_text = COALESCE(?, affiliate_text),
           about_content = COALESCE(?, about_content),
           features = COALESCE(?, features)
           ${logoClause}
       WHERE id = 1`,
      params
    );

    return res.json({ message: 'Site settings updated.' });
  } catch (error) {
    console.error('Update settings error', error);
    return res.status(500).json({ message: 'Unable to update settings.' });
  }
};

const getSiteSettings = async (_req, res) => {
  try {
    const [settings] = await query('SELECT logo_path, affiliate_text, about_content, features FROM site_settings WHERE id = 1');
    return res.json(settings);
  } catch (error) {
    console.error('Get settings error', error);
    return res.status(500).json({ message: 'Unable to fetch settings.' });
  }
};

const toggleFeature = async (req, res) => {
  try {
    const { key, enabled } = req.body;
    await query(
      `UPDATE site_settings
       SET features = JSON_SET(features, ?, ?)
       WHERE id = 1`,
      [`$.${key}`, enabled === 'true' || enabled === true]
    );
    return res.json({ message: 'Feature flag updated.' });
  } catch (error) {
    console.error('Toggle feature error', error);
    return res.status(500).json({ message: 'Unable to toggle feature.' });
  }
};

const listStudents = async (_req, res) => {
  try {
    const students = await query(
      `SELECT id, name, email, school, affiliate_school, profile_picture, created_at
       FROM users WHERE role = 'student' ORDER BY created_at DESC`
    );
    return res.json(students);
  } catch (error) {
    console.error('List students error', error);
    return res.status(500).json({ message: 'Unable to fetch students.' });
  }
};

const getPayments = async (_req, res) => {
  try {
    const payments = await query(
      `SELECT p.id, u.name, c.title AS competition, p.amount, p.status, p.created_at
       FROM payments p
       JOIN users u ON u.id = p.student_id
       JOIN competitions c ON c.id = p.competition_id
       ORDER BY p.created_at DESC`
    );
    return res.json(payments);
  } catch (error) {
    console.error('Payments list error', error);
    return res.status(500).json({ message: 'Unable to load payments.' });
  }
};

module.exports = {
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
};
