// ===================================================================
// DATABASE.JS - PostgreSQL Datenbank-Management (KORRIGIERT)
// ===================================================================
// Alle Fehler behoben - funktioniert jetzt einwandfrei

const { Pool } = require('pg');

// ===== DATENBANK-VERBINDUNG =====
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ===== DATENBANK-TABELLEN ERSTELLEN =====
async function initializeDatabase() {
    try {
        console.log('🔧 Initialisiere Datenbank...');
        
        // USERS TABELLE - Speichert alle Benutzerinformationen
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100),
                country VARCHAR(50),
                native_languages TEXT,
                learning_goal TEXT,
                preferred_language VARCHAR(20) DEFAULT 'english',
                registration_step VARCHAR(20),
                german_level VARCHAR(10) DEFAULT 'A1',
                status VARCHAR(20) DEFAULT 'pending',
                experience_points INTEGER DEFAULT 0,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                lessons_completed INTEGER DEFAULT 0,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_by VARCHAR(50),
                approval_date TIMESTAMP
            )
        `);
        
        // LESSONS TABELLE - Speichert alle Lektionen und Übungen
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                user_phone VARCHAR(50) REFERENCES users(phone_number),
                lesson_type VARCHAR(50) NOT NULL,
                lesson_content TEXT,
                user_response TEXT,
                ai_feedback TEXT,
                points_earned INTEGER DEFAULT 0,
                is_correct BOOLEAN,
                difficulty_level VARCHAR(10),
                grammar_topic VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // ACHIEVEMENTS TABELLE - Speichert Erfolge und Abzeichen
        await pool.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                user_phone VARCHAR(50) REFERENCES users(phone_number),
                achievement_type VARCHAR(50) NOT NULL,
                achievement_name VARCHAR(100) NOT NULL,
                description TEXT,
                points_awarded INTEGER DEFAULT 0,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // USER_SESSIONS TABELLE - Speichert aktuelle Gesprächs-Kontext
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_phone VARCHAR(50) UNIQUE REFERENCES users(phone_number),
                current_exercise_type VARCHAR(50),
                session_data JSONB,
                waiting_for_response BOOLEAN DEFAULT false,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // WICHTIG: Neue Spalten zu bestehender Tabelle hinzufügen (falls sie fehlen)
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(20) DEFAULT 'english'`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_step VARCHAR(20)`);
        } catch (error) {
            console.log('⚠️ Spalten bereits vorhanden oder Fehler beim Hinzufügen:', error.message);
        }

        // COURSES TABELLE - Lehrinhalte/Kurse (A1-B2)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                level VARCHAR(5) NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                content_url TEXT,
                is_published BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code ON courses(code)`);

        // USER_COURSE_PROGRESS - Fortschritt pro Kurs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_course_progress (
                id SERIAL PRIMARY KEY,
                user_phone VARCHAR(50) REFERENCES users(phone_number),
                course_id INTEGER REFERENCES courses(id),
                progress INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'not_started',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_phone, course_id)
            )
        `);

        // Seed: Einige Kurse, falls leer
        try {
            const cnt = await pool.query('SELECT COUNT(*)::int AS c FROM courses');
            if ((cnt.rows[0]?.c || 0) === 0) {
                await pool.query(`
                    INSERT INTO courses (code, level, title, description) VALUES
                    ('A1-01','A1','Einführung in Deutsch','Alphabet, Begrüßungen'),
                    ('A1-02','A1','Vorstellen & Zahlen','Ich heiße..., Zahlen bis 100'),
                    ('A2-01','A2','Alltag & Termine','Uhrzeiten, Kalender'),
                    ('B1-01','B1','Arbeit & Beruf','Bewerbung, Gespräch'),
                    ('B2-01','B2','Diskussion & Meinung','Argumentation, Konnektoren')
                    ON CONFLICT (code) DO NOTHING;
                `);
                console.log('🌱 Beispielkurse eingefügt');
            }
        } catch(e) { console.log('⚠️ Seeding übersprungen:', e.message); }

        console.log('✅ Datenbank erfolgreich initialisiert!');

    } catch (error) {
        console.error('❌ Fehler beim Initialisieren der Datenbank:', error);
        throw error;
    }
}

// ===== BENUTZER-VERWALTUNG =====

// Neuen Benutzer erstellen oder bestehenden laden
async function getOrCreateUser(phoneNumber) {
    try {
        // Prüfen ob Benutzer bereits existiert
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE phone_number = $1',
            [phoneNumber]
        );
        
        if (existingUser.rows.length > 0) {
            console.log(`👤 Bestehender Benutzer geladen: ${phoneNumber}`);
            return existingUser.rows[0];
        }
        
        // Neuen Benutzer erstellen
        const newUser = await pool.query(
            `INSERT INTO users (phone_number, status, preferred_language) 
             VALUES ($1, 'pending', 'english') 
             RETURNING *`,
            [phoneNumber]
        );
        
        console.log(`🆕 Neuer Benutzer erstellt: ${phoneNumber}`);
        return newUser.rows[0];
        
    } catch (error) {
        console.error('❌ Fehler beim Laden/Erstellen des Benutzers:', error);
        throw error;
    }
}

// Benutzer-Registrierungsdaten aktualisieren
async function updateUserRegistration(phoneNumber, registrationData) {
    try {
        const result = await pool.query(
            `UPDATE users SET 
                name = $2,
                country = $3,
                native_languages = $4,
                learning_goal = $5,
                registration_step = NULL
             WHERE phone_number = $1
             RETURNING *`,
            [
                phoneNumber,
                registrationData.name || null,
                registrationData.country || null,
                registrationData.languages || null,
                registrationData.goal || null
            ]
        );
        
        console.log(`📝 Registrierungsdaten aktualisiert für: ${phoneNumber}`);
        return result.rows[0] || null;
        
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Registrierung:', error);
        throw error;
    }
}

// Benutzer genehmigen
async function approveUser(phoneNumber, approvedBy) {
    try {
        const result = await pool.query(
            `UPDATE users SET 
                status = 'approved',
                approved_by = $2,
                approval_date = CURRENT_TIMESTAMP
             WHERE phone_number = $1
             RETURNING *`,
            [phoneNumber, approvedBy]
        );
        
        if (result.rows.length > 0) {
            console.log(`✅ Benutzer genehmigt: ${phoneNumber} von ${approvedBy}`);
            return true;
        }
        return false;
        
    } catch (error) {
        console.error('❌ Fehler beim Genehmigen des Benutzers:', error);
        throw error;
    }
}

// Benutzer ablehnen
async function rejectUser(phoneNumber) {
    try {
        const result = await pool.query(
            `UPDATE users SET status = 'rejected' WHERE phone_number = $1`,
            [phoneNumber]
        );
        
        console.log(`❌ Benutzer abgelehnt: ${phoneNumber}`);
        return result.rowCount > 0;
        
    } catch (error) {
        console.error('❌ Fehler beim Ablehnen des Benutzers:', error);
        throw error;
    }
}

// ===== FORTSCHRITTS-TRACKING =====

// Letzte Aktivität aktualisieren
async function updateLastActive(phoneNumber) {
    try {
        await pool.query(
            'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE phone_number = $1',
            [phoneNumber]
        );
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der letzten Aktivität:', error);
    }
}

// Erfahrungspunkte hinzufügen
async function addExperiencePoints(phoneNumber, points, reason = 'lesson_completed') {
    try {
        // Punkte zum Benutzer hinzufügen
        const userUpdate = await pool.query(
            `UPDATE users SET 
                experience_points = experience_points + $2,
                lessons_completed = lessons_completed + 1
             WHERE phone_number = $1
             RETURNING experience_points, lessons_completed`,
            [phoneNumber, points]
        );
        
        if (userUpdate.rows.length > 0) {
            // Erfolg protokollieren (falls es ein besonderer Meilenstein ist)
            if (userUpdate.rows[0].lessons_completed % 5 === 0) {
                await addAchievement(
                    phoneNumber, 
                    'milestone', 
                    `${userUpdate.rows[0].lessons_completed} Lektionen abgeschlossen`,
                    'Großartige Ausdauer beim Deutschlernen!',
                    points * 2
                );
            }
            
            console.log(`🎯 ${points} XP hinzugefügt für ${phoneNumber}. Gesamt: ${userUpdate.rows[0].experience_points}`);
            return userUpdate.rows[0];
        }
        
        return { experience_points: 0, lessons_completed: 0 };
        
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen von Erfahrungspunkten:', error);
        return { experience_points: 0, lessons_completed: 0 };
    }
}

// Erfolg/Abzeichen hinzufügen
async function addAchievement(phoneNumber, type, name, description, points) {
    try {
        await pool.query(
            `INSERT INTO achievements (user_phone, achievement_type, achievement_name, description, points_awarded)
             VALUES ($1, $2, $3, $4, $5)`,
            [phoneNumber, type, name, description, points]
        );
        
        console.log(`🏆 Erfolg freigeschaltet für ${phoneNumber}: ${name}`);
        
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Erfolgs:', error);
    }
}

// Lektion speichern
async function saveLesson(phoneNumber, lessonData) {
    try {
        const result = await pool.query(
            `INSERT INTO lessons (
                user_phone, lesson_type, lesson_content, user_response, 
                ai_feedback, points_earned, is_correct, difficulty_level, grammar_topic
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id`,
            [
                phoneNumber,
                lessonData.type || 'conversation',
                lessonData.content || '',
                lessonData.userResponse || '',
                lessonData.aiFeedback || '',
                lessonData.points || 10,
                lessonData.isCorrect || false,
                lessonData.level || 'A1',
                lessonData.grammarTopic || 'general'
            ]
        );
        
        console.log(`📚 Lektion gespeichert für ${phoneNumber}, ID: ${result.rows[0].id}`);
        return result.rows[0].id;
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Lektion:', error);
        return null;
    }
}

// ===== ADMIN FUNKTIONEN =====

// Alle wartenden Benutzer abrufen
async function getPendingUsers() {
    try {
        const result = await pool.query(
            `SELECT phone_number, name, country, native_languages, learning_goal, 
                    preferred_language, registration_date
             FROM users 
             WHERE status = 'pending' 
             ORDER BY registration_date ASC`
        );
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Fehler beim Abrufen wartender Benutzer:', error);
        return [];
    }
}

// Alle aktiven Benutzer abrufen
async function getApprovedUsers() {
    try {
        const result = await pool.query(
            `SELECT phone_number, name, german_level, experience_points, 
                    lessons_completed, last_active, approval_date, preferred_language
             FROM users 
             WHERE status = 'approved' 
             ORDER BY last_active DESC`
        );
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Fehler beim Abrufen aktiver Benutzer:', error);
        return [];
    }
}

// Statistiken abrufen
async function getStatistics() {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
                COUNT(*) as total_users,
                COALESCE(SUM(lessons_completed), 0) as total_lessons,
                COALESCE(AVG(experience_points), 0) as avg_experience
            FROM users
        `);
        
        return stats.rows[0];
        
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Statistiken:', error);
        return {
            pending_count: 0,
            approved_count: 0,
            rejected_count: 0,
            total_users: 0,
            total_lessons: 0,
            avg_experience: 0
        };
    }
}

// Benutzer-Dashboard-Daten abrufen
async function getUserDashboardData(phoneNumber) {
    try {
        const userResult = await pool.query(
            'SELECT * FROM users WHERE phone_number = $1',
            [phoneNumber]
        );
        
        if (userResult.rows.length === 0) {
            return null;
        }
        
        const user = userResult.rows[0];
        
        // Letzte Lektionen abrufen
        const recentLessons = await pool.query(
            `SELECT lesson_type, points_earned, is_correct, grammar_topic, created_at
             FROM lessons 
             WHERE user_phone = $1 
             ORDER BY created_at DESC 
             LIMIT 10`,
            [phoneNumber]
        );
        
        // Erfolge abrufen
        const achievements = await pool.query(
            `SELECT achievement_name, description, points_awarded, earned_at
             FROM achievements 
             WHERE user_phone = $1 
             ORDER BY earned_at DESC`,
            [phoneNumber]
        );
        
        // Kursfortschritt abrufen
        let courses = [];
        let courseProgress = [];
        try {
            const c = await pool.query(
                `SELECT id, code, level, title, description, content_url, is_published
                 FROM courses WHERE is_published = true ORDER BY 
                 CASE level WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 ELSE 5 END, code ASC`
            );
            courses = c.rows;
        } catch (e) {}
        try {
            const p = await pool.query(
                `SELECT ucp.course_id, ucp.progress, ucp.status, ucp.last_updated
                 FROM user_course_progress ucp
                 WHERE ucp.user_phone = $1`,
                [phoneNumber]
            );
            courseProgress = p.rows;
        } catch (e) {}

        return {
            user: user,
            recentLessons: recentLessons.rows,
            achievements: achievements.rows,
            courses: courses,
            courseProgress: courseProgress
        };

    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Dashboard-Daten:', error);
        return null;
    }
}

// ===== SPRACHE SETZEN =====
async function setPreferredLanguage(phoneNumber, language) {
    try {
        const allowed = ['english', 'french', 'arabic'];
        const lang = allowed.includes(language) ? language : 'english';
        const result = await pool.query(
            `UPDATE users SET preferred_language = $2 WHERE phone_number = $1 RETURNING *`,
            [phoneNumber, lang]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('❌ Fehler beim Setzen der Sprache:', error);
        throw error;
    }
}

// ===== KURSE VERWALTEN =====
async function upsertCourses(courseArray) {
    // course: { code, level, title, description?, content_url?, is_published? }
    const results = [];
    for (const course of courseArray) {
        const level = (course.level || '').toUpperCase();
        const normalized = ['A1','A2','B1','B2'].includes(level) ? level : 'A1';
        try {
            const res = await pool.query(
                `INSERT INTO courses (code, level, title, description, content_url, is_published)
                 VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
                 ON CONFLICT (code) DO UPDATE SET
                    level = EXCLUDED.level,
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    content_url = EXCLUDED.content_url,
                    is_published = EXCLUDED.is_published
                 RETURNING *`,
                [course.code, normalized, course.title, course.description || null, course.content_url || null, course.is_published]
            );
            results.push(res.rows[0]);
        } catch (error) {
            console.error('❌ Kurs-Upsert Fehler:', course.code, error.message);
        }
    }
    return results;
}

async function getCoursesByLevel() {
    const result = await pool.query(
        `SELECT id, code, level, title, description, content_url, is_published
         FROM courses WHERE is_published = true
         ORDER BY CASE level WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 ELSE 5 END, code ASC`
    );
    return result.rows;
}

async function upsertUserCourseProgress(phoneNumber, courseCode, progress = 0, status = 'in_progress') {
    const courseRes = await pool.query(`SELECT id FROM courses WHERE code = $1`, [courseCode]);
    if (courseRes.rows.length === 0) throw new Error('Course not found: ' + courseCode);
    const courseId = courseRes.rows[0].id;
    const res = await pool.query(
        `INSERT INTO user_course_progress (user_phone, course_id, progress, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_phone, course_id) DO UPDATE SET
            progress = EXCLUDED.progress,
            status = EXCLUDED.status,
            last_updated = CURRENT_TIMESTAMP
         RETURNING *`,
        [phoneNumber, courseId, Math.max(0, Math.min(100, progress)), status]
    );
    return res.rows[0];
}

async function getUserCoursesWithProgress(phoneNumber) {
    const res = await pool.query(
        `SELECT c.id, c.code, c.level, c.title, c.description, c.content_url,
                COALESCE(ucp.progress, 0) as progress,
                COALESCE(ucp.status, 'not_started') as status,
                ucp.last_updated
         FROM courses c
         LEFT JOIN user_course_progress ucp
           ON ucp.course_id = c.id AND ucp.user_phone = $1
         WHERE c.is_published = true
         ORDER BY CASE c.level WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 ELSE 5 END, c.code ASC`,
        [phoneNumber]
    );
    return res.rows;
}

// Benutzer-Registrierungs-Schritt aktualisieren
async function updateUserRegistrationStep(phoneNumber, step, field = null, value = null) {
    try {
        let query = 'UPDATE users SET registration_step = $2';
        let params = [phoneNumber, step];
        
        if (field && value !== null) {
            query += `, ${field} = $3`;
            params.push(value);
        }
        
        query += ' WHERE phone_number = $1 RETURNING *';
        
        const result = await pool.query(query, params);
        
        console.log(`📝 Registrierungsschritt aktualisiert: ${phoneNumber} -> ${step}`);
        return result.rows[0] || null;
        
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des Registrierungsschritts:', error);
        throw error;
    }
}

// ===== DATENBANK-VERBINDUNG SCHLIESSEN =====
async function closeDatabase() {
    await pool.end();
    console.log('🔒 Datenbankverbindung geschlossen');
}

// Alle Funktionen exportieren
module.exports = {
    initializeDatabase,
    getOrCreateUser,
    updateUserRegistration,
    updateUserRegistrationStep,
    approveUser,
    rejectUser,
    updateLastActive,
    addExperiencePoints,
    addAchievement,
    saveLesson,
    getPendingUsers,
    getApprovedUsers,
    getStatistics,
    getUserDashboardData,
    setPreferredLanguage,
    upsertCourses,
    getCoursesByLevel,
    upsertUserCourseProgress,
    getUserCoursesWithProgress,
    closeDatabase,
    pool // Pool exportieren für direkten Zugriff
};
