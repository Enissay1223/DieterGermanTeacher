const express = require('express');
const router = express.Router();

const {
  getOrCreateUser,
  setPreferredLanguage,
  getCoursesByLevel
} = require('../database');

// Helper: map user input to language code
function parseLanguageToken(input) {
  const t = (input || '').toLowerCase().trim();
  if (['1','en','english'].includes(t)) return 'english';
  if (['2','fr','french'].includes(t)) return 'french';
  if (['3','ar','arabic'].includes(t)) return 'arabic';
  return null;
}

router.post('/', async (req, res) => {
  const app = req.app;
  const incomingMessage = req.body.Body || '';
  const fromNumber = req.body.From;
  const { sendMessage } = app.locals.msgService;
  const { getAIResponse } = app.locals.aiService;

  try {
    const user = await getOrCreateUser(fromNumber);

    const msg = incomingMessage.trim();
    const low = msg.toLowerCase();

    // Sprache anzeigen/ändern
    if (low.startsWith('lang') || low.startsWith('sprache') || low === 'language') {
      const parts = low.split(/\s+/);
      if (parts[1]) {
        const lang = parseLanguageToken(parts[1]);
        if (lang) {
          await setPreferredLanguage(fromNumber, lang);
          await sendMessage(fromNumber, {
            english: '✅ Language updated to English.',
            french: '✅ Langue changée en français.',
            arabic: '✅ تم تغيير اللغة إلى العربية.'
          }[lang]);
          return res.status(200).send('OK');
        }
      }
      await sendMessage(fromNumber, '🌍 Sprache ändern:\nLANG 1 (English)\nLANG 2 (Français)\nLANG 3 (العربية)');
      return res.status(200).send('OK');
    }

    // Dashboard-Link
    if (['dashboard','mein dashboard','profil','stats'].includes(low)) {
      const token = app.locals.signToken(fromNumber);
      const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const url = `${base}/dashboard/me?phone=${encodeURIComponent(fromNumber)}&token=${token}`;
      await sendMessage(fromNumber, `📊 Dein persönliches Dashboard:\n${url}`);
      return res.status(200).send('OK');
    }

    // Kurse Kurzinfo
    if (['kurse','kurs','courses','course'].includes(low)) {
      const all = await getCoursesByLevel();
      const counts = { A1: 0, A2: 0, B1: 0, B2: 0 };
      all.forEach(c => { if (counts[c.level] !== undefined) counts[c.level]++; });
      const token = app.locals.signToken(fromNumber);
      const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const url = `${base}/dashboard/me?phone=${encodeURIComponent(fromNumber)}&token=${token}`;
      await sendMessage(fromNumber, `📚 Kurse verfügbar:\nA1: ${counts.A1} • A2: ${counts.A2} • B1: ${counts.B1} • B2: ${counts.B2}\nDetails & Fortschritt: ${url}`);
      return res.status(200).send('OK');
    }

    // Default: AI-Antwort
    const result = await getAIResponse(incomingMessage, fromNumber);
    await sendMessage(fromNumber, result.text);
    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('OK');
  }
});

module.exports = router;

