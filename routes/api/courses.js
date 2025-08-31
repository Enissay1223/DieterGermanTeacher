const express = require('express');
const router = express.Router();
const { getCoursesByLevel, upsertCourses } = require('../../database');

router.get('/', async (_req, res) => {
  const list = await getCoursesByLevel();
  res.json(list);
});

router.post('/import', async (req, res) => {
  const { password, payload } = req.body;
  if ((password || '') !== (process.env.ADMIN_PASSWORD || 'DeutschLehrer2024!')) {
    return res.status(401).json({ error: 'Falsches Passwort' });
  }
  let data;
  try { data = Array.isArray(req.body) ? req.body : (typeof payload === 'string' ? JSON.parse(payload) : payload); }
  catch { return res.status(400).json({ error: 'Ungültiges JSON' }); }
  if (!Array.isArray(data)) return res.status(400).json({ error: 'Erwarte JSON-Array' });
  const result = await upsertCourses(data);
  res.json({ success: true, count: result.length });
});

module.exports = router;

