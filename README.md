# 🇩🇪 WhatsApp Deutschlehrer Bot

Ein professioneller WhatsApp Bot für DaF/DaZ (Deutsch als Fremd- und Zweitsprache) mit integriertem Freigabe-System und KI-gestütztem Deutschunterricht.

## ✨ Features

### 🎓 Professioneller Deutschunterricht
- **KI-gestützte Lehrmethoden** basierend auf echter DaF/DaZ Expertise
- **Sprachniveau-Erkennung** (A1-C2 nach GER)
- **Kontrastive Linguistik** für Arabisch- und Französischsprecher
- **Prüfungsvorbereitung** für Goethe, telc, DTZ, TestDaF

### 🔐 Sicheres Freigabe-System
- **Admin-Kontrolle** über alle Nutzer-Registrierungen
- **WhatsApp + Web-Admin-Panel** für einfache Verwaltung
- **Nutzer-Status-Management** (Pending, Approved, Rejected, Suspended)
- **Automatische Benachrichtigungen** bei neuen Anmeldungen

### 📊 Nutzer-Management
- **Fortschrittstracking** pro Schüler
- **Schwächen-/Stärken-Analyse** 
- **Lernziel-Verfolgung** und Prüfungsvorbereitung
- **Aktivitäts-Statistiken** und Engagement-Metriken

### 🎯 DaF/DaZ Expertise
- **Fehlerkorrektur** nach professionellen Standards
- **Motivierende Lernmethodik** mit positiver Verstärkung
- **Kulturelle Integration** (Landeskunde Deutschland)
- **Praxisnahe Übungen** für Alltag und Beruf

## 🚀 Schnellstart

### 1. Voraussetzungen
- **Twilio Account** (kostenlose Testversion)
- **OpenAI API Key** (GPT-4 Zugang)
- **Railway Account** (kostenloses Hosting)
- **GitHub Account** (Code-Verwaltung)

### 2. Umgebungsvariablen
Erstelle diese Umgebungsvariablen in Railway:

```env
TWILIO_ACCOUNT_SID=dein_twilio_account_sid
TWILIO_AUTH_TOKEN=dein_twilio_auth_token
OPENAI_API_KEY=dein_openai_api_key
ADMIN_PASSWORD=dein_sicheres_passwort
ADMIN_PHONE_1=whatsapp:+49deine_nummer
ADMIN_PHONE_2=whatsapp:+49weitere_admin_nummer
PORT=3000
PUBLIC_BASE_URL=https://deine-app.railway.app
DASHBOARD_SECRET=super_geheimes_token
# Wird vom Railway Postgres Plugin automatisch gesetzt:
# DATABASE_URL=postgres://...
```

### 3. Deployment
1. Dieses Verzeichnis nach GitHub pushen (ohne `node_modules`)
2. In Railway: New Project → Deploy from GitHub → Repo wählen
3. Environment Variables setzen (siehe unten). Railway installiert automatisch und startet `npm start`
4. Optional: PostgreSQL Plugin in Railway hinzufügen (setzt `DATABASE_URL` automatisch)
5. Optional: Twilio Webhook auf `https://<railway-app>/webhook` setzen

## 📱 WhatsApp Setup

### Twilio WhatsApp Sandbox
1. In Twilio Console: **Messaging → Try it out → WhatsApp**
2. Folge den Sandbox-Anweisungen
3. **Webhook URL setzen:** `https://deine-app.railway.app/webhook`
4. **HTTP Method:** POST

### Erste Schritte für Nutzer
1. Sende `join [sandbox-name]` an **+1 415 523 8886**
2. Schreibe **"REGISTER"** um Anmeldung zu starten
3. Folge dem Registrierungsprozess
4. Warte auf Admin-Genehmigung
5. Starte mit dem Deutschlernen!
6. Sprache ändern: Sende `LANG` (oder `SPRACHE`) bzw. `LANG 1/2/3`
7. Eigenes Dashboard-Link: Sende `DASHBOARD` per WhatsApp

## 🔧 Admin Panel

### Web-Interface
- **URL:** `https://deine-app.railway.app/admin`
- **Login:** Mit konfigurierten Admin-Passwort
- **Features:** Nutzer genehmigen/ablehnen, Statistiken, Nutzerverwaltung
  - Kurse verwalten: `https://deine-app.railway.app/admin/courses` (JSON-Import)
  - Demo anlegen (schnell testen): `https://deine-app.railway.app/admin/demo?password=<ADMIN_PASSWORD>`

### WhatsApp Admin-Kommandos
- `APPROVE whatsapp:+49123456789` - Nutzer genehmigen
- `REJECT whatsapp:+49123456789` - Nutzer ablehnen  
- `SUSPEND whatsapp:+49123456789` - Nutzer sperren
- `STATS` - Statistiken anzeigen

## 📚 Training Data Integration

### DaF/DaZ Materialien hinzufügen
1. **Bearbeite `training_data.txt`**
2. **Struktur beibehalten:** Themen, Fehlerkorrekturen, Übungen
3. **Commit & Push** → Automatisches Neu-Deployment
4. **Bot nutzt sofort** neue Materialien

### Beispiel-Format
```
### THEMA ###
PROBLEM: Beschreibung des typischen Fehlers
HÄUFIGSTE FEHLER: Beispiele
KORREKTUR-METHODE: Wie erklärt man es richtig
BOT-ANTWORT-STIL: Vorlage für Bot-Antworten
```

## 📊 Kosten-Übersicht

### Entwicklung (Einmalig)
- **Setup-Zeit:** 2-3 Stunden
- **Kosten:** €0 (alle Tools haben kostenlose Versionen)

### Laufende Kosten (Monatlich)
| Nutzer | OpenAI API | Twilio | Railway | **Total** | Pro Nutzer |
|--------|------------|--------|---------|-----------|------------|
| 5      | €8         | €2     | €0*     | €10       | €2.00      |
| 20     | €25        | €5     | €7      | €37       | €1.85      |
| 50     | €50        | €10    | €15     | €75       | €1.50      |
| 100    | €80        | €18    | €25     | €123      | €1.23      |

*Railway: Erste 500 Stunden kostenlos

### Revenue-Modell Vorschlag
- **€15/Monat** pro Nutzer
- **Break-even** bei 6-8 Nutzern
- **Skalierbar** für hunderte Nutzer

## 🛠️ Technische Architektur

### Backend
- **Node.js/Express** - Web-Server und API
- **Twilio SDK** - WhatsApp Integration
- **OpenAI GPT-4** - KI-Deutschlehrer
- **In-Memory Storage** - Nutzer-Daten (upgradable zu PostgreSQL)

### Frontend
- **Vanilla HTML/CSS/JS** - Admin Panel
- **Responsive Design** - Mobile-optimiert
- **Real-time Updates** - Live Admin-Benachrichtigungen
- **User Dashboard** - Persönliche Seite unter `/dashboard/me` mit signierten Links

### Hosting & Deployment
- **Railway.app** - Automatisches Deployment
- **GitHub Integration** - Kontinuierliche Bereitstellung
- **Environment Variables** - Sichere Konfiguration
- **24/7 Uptime** - Professionelle Verfügbarkeit

## 🔒 Sicherheit & Datenschutz

### Nutzer-Daten
- **Minimale Datensammlung** - Nur notwendige Informationen
- **Sichere Speicherung** - Keine Passwörter, nur WhatsApp-Nummern
- **Admin-Kontrolle** - Vollständige Nutzer-Verwaltung

### API-Sicherheit  
- **Umgebungsvariablen** für alle sensiblen Daten
- **Admin-Passwort-Schutz** für Web-Panel
- **WhatsApp-Nummer-Validierung** für Admin-Kommandos

## 📈 Erweiterte Features (Roadmap)

### Phase 1 (Aktuell)
- ✅ Basic WhatsApp Bot
- ✅ Freigabe-System
- ✅ Admin Panel
- ✅ DaF/DaZ Training Integration

### Phase 2 (Nächste 4 Wochen)
- 🔄 **PostgreSQL Datenbank** für bessere Skalierung
- 🔄 **Sprachnachrichten-Support** mit Whisper API
- 🔄 **Prüfungssimulation** mit spezifischen Aufgaben
- 🔄 **Fortschritts-Grafiken** und detaillierte Analytics
- 🔄 **Kurse & Fortschritt (A1–B2)** – Basis integriert

### Phase 3 (Langfristig)  
- ⏳ **Payment Integration** (Stripe/PayPal)
- ⏳ **Mehrsprachigkeit** (Türkisch, Spanisch Support)
- ⏳ **Hausaufgaben-System** mit automatischer Bewertung
- ⏳ **API für Sprachschulen** und Bildungseinrichtungen

## 🤝 Beitragen

## 🧭 Neue Features (dieser Stand)

- 👤 Persönliches Dashboard pro Nutzer: `/dashboard/me?phone=...&token=...`
- 🌍 Sprachwechsel nach Registrierung via WhatsApp (`LANG`, `LANG 1/2/3`)
- 📚 Kursverwaltung mit PostgreSQL-Tabellen `courses` und `user_course_progress`
- 🛠️ Admin-Import für Kurse: `/admin/courses` (JSON-Array)

### Kurs-JSON Beispiel
```json
[
  {"code":"A1-01","level":"A1","title":"Einführung in Deutsch","description":"Grundlagen","content_url":"https://..."},
  {"code":"A1-02","level":"A1","title":"Begrüßungen","description":"Hallo, Guten Tag"}
]
```

### Materialien hinzufügen
1. **Fork** das Repository
2. **Erweitere** `training_data.txt` mit neuen DaF/DaZ Inhalten
3. **Teste** die Änderungen lokal
4. **Pull Request** erstellen

### Bug Reports
- **GitHub Issues** für technische Probleme
- **Detaillierte Beschreibung** mit Schritten zur Reproduktion
- **Screenshots** bei UI-Problemen

## 📞 Support

### Technischer Support
- **GitHub Issues** für Code-Probleme
- **Railway Logs** für Deployment-Probleme
- **Twilio Console** für WhatsApp-Verbindungsprobleme

### DaF/DaZ Fachfragen
- **Training Data** für neue Lehrmethoden
- **Prüfungsvorbereitung** für spezifische Zertifikate
- **Kulturelle Integration** für verschiedene Herkunftsländer

## 📄 Lizenz

Dieses Projekt ist unter der **MIT Lizenz** veröffentlicht - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagungen

- **DaF/DaZ Expertise** von professionellen Deutschlehrern
- **OpenAI GPT-4** für intelligente Spracherkennung
- **Twilio WhatsApp API** für nahtlose Kommunikation
- **Railway.app** für zuverlässiges Hosting

---

**🎯 Ziel:** Deutschlernen für Migranten und Geflüchtete zugänglicher und effektiver machen durch professionelle KI-gestützte Lehrmethoden.

**📧 Kontakt:** [Deine E-Mail] | **🌐 Demo:** [Deine Railway URL]
