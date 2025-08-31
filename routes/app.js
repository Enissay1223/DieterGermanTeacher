const express = require('express');
const router = express.Router();

const {
  getUserDashboardData,
  getUserCoursesWithProgress,
  setPreferredLanguage
} = require('../database');

function verifyToken(signToken, phone, token) {
  const expected = signToken(phone);
  return expected && token && expected === token;
}

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

module.exports = router;

