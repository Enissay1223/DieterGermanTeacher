const express = require('express');
const router = express.Router();

const {
  getStatistics,
  getPendingUsers,
  getApprovedUsers,
  rejectUser,
  approveUser,
  getCoursesByLevel,
  upsertCourses,
  getOrCreateUser,
  upsertUserCourseProgress
} = require('../database');

router.get('/', async (req, res) => {
  try {
    const stats = await getStatistics();
    const pendingUsers = await getPendingUsers();
    const activeUsers = await getApprovedUsers();
    res.render('admin', { stats, pendingUsers, activeUsers });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

router.post('/approve', async (req, res) => {
  const { phone, password } = req.body;
  if ((password || '') !== (process.env.ADMIN_PASSWORD || 'DeutschLehrer2024!')) {
    return res.status(401).json({ error: 'Falsches Passwort' });
  }
  try {
    const ok = await approveUser(phone, 'web_admin');
    if (!ok) return res.status(404).json({ error: 'Nutzer konnte nicht genehmigt werden' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

router.post('/reject', async (req, res) => {
  const { phone, password } = req.body;
  if ((password || '') !== (process.env.ADMIN_PASSWORD || 'DeutschLehrer2024!')) {
    return res.status(401).json({ error: 'Falsches Passwort' });
  }
  try {
    const ok = await rejectUser(phone);
    if (!ok) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

router.get('/courses', async (req, res) => {
  const list = await getCoursesByLevel();
  res.render('admin_courses', { courses: list });
});

router.post('/courses/import', async (req, res) => {
  try {
    const { password, payload } = req.body;
    if ((password || '') !== (process.env.ADMIN_PASSWORD || 'DeutschLehrer2024!')) {
      return res.status(401).send('Falsches Passwort');
    }
    let data;
    try { data = typeof payload === 'string' ? JSON.parse(payload) : payload; }
    catch { return res.status(400).send('Ungültiges JSON'); }
    if (!Array.isArray(data)) return res.status(400).send('Erwarte JSON-Array');
    await upsertCourses(data);
    res.redirect('/admin/courses');
  } catch (e) {
    console.error('Kurs-Import Fehler:', e);
    res.status(500).send('Server Error');
  }
});

// Schnell-Demo: legt einen genehmigten Testnutzer an und zeigt Link
router.get('/demo', async (req, res) => {
  const password = req.query.password || '';
  if (password !== (process.env.ADMIN_PASSWORD || 'DeutschLehrer2024!')) {
    return res.status(401).send('Falsches Passwort');
  }
  const phone = 'whatsapp:+49123456789';
  await getOrCreateUser(phone);
  await approveUser(phone, 'demo');
  // etwas Fortschritt setzen
  try { await upsertUserCourseProgress(phone, 'A1-01', 40, 'in_progress'); } catch {}
  try { await upsertUserCourseProgress(phone, 'A1-02', 10, 'in_progress'); } catch {}
  const token = req.app.locals.signToken(phone);
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${base}/dashboard/me?phone=${encodeURIComponent(phone)}&token=${token}`;
  res.send(`✅ Demo-Nutzer angelegt: ${phone}<br/><a href="${url}">Zum persönlichen Dashboard</a>`);
});

module.exports = router;
