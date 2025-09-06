const express = require('express');
const router = express.Router();

const {
  getStatistics,
  getPendingUsers,
  getApprovedUsers,
  rejectUser,
  approveUser,
  getCoursesByLevel,
  createCourse,
  updateCourse,
  createLesson,
  createExercise,
  getCourseWithLessons,
  getLessonWithExercises,
  getOrCreateUser,
  createSubscription,
  getSubscription
} = require('../database');

// ===== ADMIN AUTHENTIFIZIERUNG =====
function requireAdmin(req, res, next) {
  const password = req.body.password || req.query.password || req.headers['x-admin-password'];
  if (password !== (process.env.ADMIN_PASSWORD || 'test123')) {
    return res.status(401).json({ error: 'Falsches Admin-Passwort' });
  }
  next();
}

// ===== HAUPT-ADMIN-PANEL =====
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

// ===== INHALTS-VERWALTUNG =====
router.get('/content', requireAdmin, async (req, res) => {
  try {
    const courses = await getCoursesByLevel();
    res.render('admin_content', { courses });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// Neuen Kurs erstellen
router.post('/content/courses', requireAdmin, async (req, res) => {
  try {
    const { code, level, title, description } = req.body;
    const course = await createCourse({ code, level, title, description });
    res.json({ success: true, course });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Fehler beim Erstellen des Kurses' });
  }
});

// Kurs bearbeiten
router.put('/content/courses/:id', requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const course = await updateCourse(courseId, req.body);
    res.json({ success: true, course });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Fehler beim Bearbeiten des Kurses' });
  }
});

// Neue Lektion erstellen
router.post('/content/lessons', requireAdmin, async (req, res) => {
  try {
    const { course_id, title, content, order_index } = req.body;
    const lesson = await createLesson({ course_id, title, content, order_index });
    res.json({ success: true, lesson });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Fehler beim Erstellen der Lektion' });
  }
});

// Neue Übung erstellen
router.post('/content/exercises', requireAdmin, async (req, res) => {
  try {
    const { lesson_id, type, question, options, correct_answer, explanation } = req.body;
    const exercise = await createExercise({ lesson_id, type, question, options, correct_answer, explanation });
    res.json({ success: true, exercise });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Fehler beim Erstellen der Übung' });
  }
});

// ===== AUFGABEN-BEREICH =====
router.get('/exercises', requireAdmin, async (req, res) => {
  try {
    const courses = await getCoursesByLevel();
    res.render('admin_exercises', { courses });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// ===== SCHÜLER-MANAGEMENT =====
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const students = await getApprovedUsers();
    res.render('admin_students', { students });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// ===== BILLING-SYSTEM =====
router.get('/billing', requireAdmin, async (req, res) => {
  try {
    const students = await getApprovedUsers();
    res.render('admin_billing', { students });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// Abonnement erstellen
router.post('/billing/subscriptions', requireAdmin, async (req, res) => {
  try {
    const { user_id, plan, months } = req.body;
    const subscription = await createSubscription(parseInt(user_id), plan, parseInt(months));
    res.json({ success: true, subscription });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Fehler beim Erstellen des Abonnements' });
  }
});

// ===== BESTEHENDE FUNKTIONEN =====
router.post('/approve', async (req, res) => {
  const { phone, password } = req.body;
  if ((password || '') !== (process.env.ADMIN_PASSWORD || 'test123')) {
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
  if ((password || '') !== (process.env.ADMIN_PASSWORD || 'test123')) {
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

// ===== DEMO-FUNKTION =====
router.get('/demo', async (req, res) => {
  const password = req.query.password || '';
  if (password !== (process.env.ADMIN_PASSWORD || 'test123')) {
    return res.status(401).send('Falsches Passwort. Verwende: test123');
  }
  
  const demoPhone = 'whatsapp:+49123456789';
  const token = req.app.locals.signToken(demoPhone);
  const dashboardUrl = `/dashboard/me?phone=${encodeURIComponent(demoPhone)}&token=${token}`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Demo erstellt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>✅ Demo-Nutzer erfolgreich erstellt!</h1>
      <p><strong>Telefonnummer:</strong> ${demoPhone}</p>
      <p><strong>Token:</strong> ${token}</p>
      <br>
      <a href="${dashboardUrl}" class="btn">🚀 Zum persönlichen Dashboard</a>
      <br><br>
      <a href="/admin">← Zurück zum Admin Panel</a>
    </body>
    </html>
  `);
});

module.exports = router;
