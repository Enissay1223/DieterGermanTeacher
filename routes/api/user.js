const express = require('express');
const router = express.Router();
const { getUserDashboardData, setPreferredLanguage } = require('../../database');

router.get('/me', async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const data = await getUserDashboardData(phone);
  if (!data) return res.status(404).json({ error: 'not found' });
  res.json({ user: data.user });
});

router.patch('/language', async (req, res) => {
  const { phone, language } = req.body;
  if (!phone || !language) return res.status(400).json({ error: 'phone and language required' });
  const updated = await setPreferredLanguage(phone, language);
  res.json({ success: true, user: updated });
});

module.exports = router;

