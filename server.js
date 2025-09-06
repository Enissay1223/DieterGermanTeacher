const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./database');
const { MessageService } = require('./services/messages');
const { AIService } = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;
const isLocalTest = process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID;

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
  const secret = process.env.DASHBOARD_SECRET || 'demo-secret';
  return Buffer.from(phone + secret).toString('base64');
}

// ===== SERVICES ZU APP LOCALS HINZUFÜGEN =====
app.locals.msgService = msgService;
app.locals.aiService = aiService;
app.locals.signToken = signToken;
app.locals.isLocalTest = isLocalTest;

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
          ${isLocalTest ? '<p style="color: orange;">🔧 Lokaler Test-Modus aktiv</p>' : ''}
        </div>
      </div>
    `
  });
});

// ===== LOKALER TEST-MODUS =====
if (isLocalTest) {
  console.log('🔧 Lokaler Test-Modus aktiviert');
  
  // Demo-Nutzer für lokale Tests
  app.get('/demo', (req, res) => {
    const password = req.query.password || '';
    if (password !== 'test123') {
      return res.status(401).send('Falsches Passwort. Verwende: test123');
    }
    
    const demoPhone = 'whatsapp:+49123456789';
    const token = signToken(demoPhone);
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
  
  // Lokale WhatsApp-Simulation
  app.post('/local-test', (req, res) => {
    const { phone, message } = req.body;
    console.log(`📱 Lokale Nachricht von ${phone}: ${message}`);
    res.json({ success: true, message: 'Nachricht simuliert' });
  });
}

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
      if (isLocalTest) {
        console.log(`🔧 Demo Dashboard: http://localhost:${PORT}/demo?password=test123`);
        console.log(`📱 Lokale Tests: http://localhost:${PORT}/local-test`);
      }
    });
  } catch (error) {
    console.error('❌ Fehler beim Serverstart:', error);
    process.exit(1);
  }
}

startServer();
