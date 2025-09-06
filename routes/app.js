const express = require('express');
const router = express.Router();

const {
  getUserDashboardData,
  getUserCoursesWithProgress,
  setPreferredLanguage,
  getCoursesByLevel,
  getCourseWithLessons,
  getLessonWithExercises,
  submitExerciseAnswer
} = require('../database');

function verifyToken(signToken, phone, token) {
  const expected = signToken(phone);
  return expected && token && expected === token;
}

// ===== PERSÖNLICHES DASHBOARD =====
router.get('/me', async (req, res) => {
  const phone = req.query.phone;
  const token = req.query.token;
  if (!phone || !verifyToken(req.app.locals.signToken, phone, token)) {
    return res.status(401).send('Unauthorized');
  }
  
  const setLang = req.query.setLang;
  if (setLang) {
    const map = { en: 'english', fr: 'french', ar: 'arabic' };
    const norm = map[(setLang || '').toLowerCase()] || setLang;
    if (['english','french','arabic'].includes(norm)) await setPreferredLanguage(phone, norm);
  }
  
  const data = await getUserDashboardData(phone);
  const courses = await getUserCoursesWithProgress(phone);
  if (!data) return res.status(404).send('Not found');
  
  res.render('app', { data, courses, phone, token });
});

// ===== SCHÜLER-WEB-INTERFACE (OHNE WHATSAPP) =====
router.get('/courses', async (req, res) => {
  try {
    const courses = await getCoursesByLevel();
    res.render('student_courses', { courses });
  } catch (error) {
    res.status(500).send('Fehler beim Laden der Kurse');
  }
});

router.get('/courses/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const course = await getCourseWithLessons(courseId);
    if (!course) return res.status(404).send('Kurs nicht gefunden');
    
    res.render('student_course_detail', { course });
  } catch (error) {
    res.status(500).send('Fehler beim Laden des Kurses');
  }
});

router.get('/lessons/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const lesson = await getLessonWithExercises(lessonId);
    if (!lesson) return res.status(404).send('Lektion nicht gefunden');
    
    res.render('student_lesson', { lesson });
  } catch (error) {
    res.status(500).send('Fehler beim Laden der Lektion');
  }
});

// ===== ÜBUNGEN LÖSEN =====
router.post('/exercises/:id/submit', async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);
    const { answer, userId } = req.body;
    
    if (!answer || !userId) {
      return res.status(400).json({ error: 'Antwort und Nutzer-ID erforderlich' });
    }
    
    const result = await submitExerciseAnswer(parseInt(userId), exerciseId, answer);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Überprüfen der Antwort' });
  }
});

// ===== SPRACHWECHSEL =====
router.post('/language', async (req, res) => {
  try {
    const { phone, language } = req.body;
    if (!phone || !language) {
      return res.status(400).json({ error: 'Telefonnummer und Sprache erforderlich' });
    }
    
    await setPreferredLanguage(phone, language);
    res.json({ success: true, message: 'Sprache erfolgreich geändert' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Ändern der Sprache' });
  }
});

module.exports = router;

