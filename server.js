const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./database');
const { MessageService } = require('./services/messages');
const { AIService } = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== VIEW ENGINE =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== SERVICES INITIALISIEREN =====
const msgService = new MessageService();
const aiService = new AIService();

// ===== HELPER FUNCTIONS =====
function signToken(phone) {
  // Einfacher Token für Demo-Zwecke
  // In Produktion solltest du hier eine sichere Hash-Funktion verwenden
  return Buffer.from(phone + process.env.DASHBOARD_SECRET || 'demo-secret').toString('base64');
}

// ===== SERVICES ZU APP LOCALS HINZUFÜGEN =====
app.locals.msgService = msgService;
app.locals.aiService = aiService;
app.locals.signToken = signToken;

// ===== ROUTEN =====
app.use('/webhook', require('./routes/webhook'));
app.use('/dashboard', require('./routes/app'));
app.use('/admin', require('./routes/admin-pages'));

// ===== API ROUTEN =====
app.use('/api/courses', require('./routes/api/courses'));
app.use('/api/progress', require('./routes/api/progress'));
app.use('/api/user', require('./routes/api/user'));

// ===== HAUPTSEITE =====
app.get('/', (req, res) => {
  res.render('layout', { 
    title: '🇩🇪 WhatsApp Deutschlehrer Bot',
    content: `
      <div class="hero">
        <h1>🇩🇪 WhatsApp Deutschlehrer Bot</h1>
        <p>Professioneller Deutschunterricht per WhatsApp mit KI-Unterstützung</p>
        <div class="features">
          <div class="feature">
            <h3>🎓 A1-B2 Prüfungsvorbereitung</h3>
            <p>Gehe, telc, DTZ, TestDaF</p>
          </div>
          <div class="feature">
            <h3>🤖 KI-gestützter Unterricht</h3>
            <p>OpenAI GPT-4 Integration</p>
          </div>
          <div class="feature">
            <h3>📱 WhatsApp Integration</h3>
            <p>Einfach per Nachricht starten</p>
          </div>
        </div>
        <div class="cta">
          <p>📱 Sende "REGISTER" an +1 415 523 8886</p>
          <p>🌐 <a href="/admin">Admin Panel</a></p>
        </div>
      </div>
    `
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Ein Fehler ist aufgetreten');
});

// ===== SERVER STARTEN =====
async function startServer() {
  try {
    // Datenbank initialisieren
    await initializeDatabase();
    console.log('✅ Datenbank erfolgreich initialisiert');
    
    // Server starten
    app.listen(PORT, () => {
      console.log(`🚀 Server läuft auf Port ${PORT}`);
      console.log(`🌐 Öffne http://localhost:${PORT} im Browser`);
      console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
    });
  } catch (error) {
    console.error('❌ Fehler beim Serverstart:', error);
    process.exit(1);
  }
}

startServer();
