const express = require('express');
const router = express.Router();
const { upsertUserCourseProgress } = require('../../database');

router.post('/', async (req, res) => {
  const { phone, courseCode, progress, status } = req.body || {};
  if (!phone || !courseCode) return res.status(400).json({ error: 'phone and courseCode required' });
  const row = await upsertUserCourseProgress(phone, courseCode, progress ?? 0, status || 'in_progress');
  res.json({ success: true, progress: row });
});

module.exports = router;

