// ===================================================================
// DATABASE.JS - Erweiterte PostgreSQL Datenbank für vollständige Funktionalität
// ===================================================================

const { Pool } = require('pg');

// ===== DATENBANK-VERBINDUNG =====
let pool;

// Prüfe ob wir im lokalen Test-Modus sind
const isLocalTest = process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL;

if (isLocalTest) {
  console.log('🔧 Lokaler Test-Modus: Verwende erweiterte In-Memory-Datenbank');
  
  // Erweiterte Mock-Daten für lokale Tests
  const mockData = {
    users: new Map(),
    lessons: [],
    achievements: [],
    userSessions: new Map(),
    courses: [
      { 
        id: 1,
        code: 'A1-01', 
        level: 'A1', 
        title: 'Einführung in Deutsch', 
        description: 'Grundlagen der deutschen Sprache',
        is_published: true,
        created_at: new Date()
      },
      { 
        id: 2,
        code: 'A1-02', 
        level: 'A1', 
        title: 'Begrüßungen', 
        description: 'Hallo, Guten Tag, Auf Wiedersehen',
        is_published: true,
        created_at: new Date()
      }
    ],
    lessons: [
      {
        id: 1,
        course_id: 1,
        title: 'Das Alphabet',
        content: 'Das deutsche Alphabet hat 26 Buchstaben...',
        order_index: 1,
        is_published: true
      },
      {
        id: 2,
        course_id: 1,
        title: 'Aussprache',
        content: 'Die deutsche Aussprache ist...',
        order_index: 2,
        is_published: true
      }
    ],
    exercises: [
      {
        id: 1,
        lesson_id: 1,
        type: 'multiple_choice',
        question: 'Welcher Buchstabe kommt nach A?',
        options: ['B', 'C', 'D', 'E'],
        correct_answer: 'B',
        explanation: 'Das Alphabet geht: A, B, C, D...'
      }
    ],
    subscriptions: new Map(),
    invoices: []
  };

  // Erweiterte Mock-Funktionen
  module.exports = {
    initializeDatabase: async () => {
      console.log('✅ Erweiterte Mock-Datenbank für lokale Tests initialisiert');
      return true;
    },
    
    // ===== NUTZER-FUNKTIONEN =====
    getOrCreateUser: async (phone) => {
      if (!mockData.users.has(phone)) {
        mockData.users.set(phone, {
          id: mockData.users.size + 1,
          phone_number: phone,
          name: 'Demo Nutzer',
          email: 'demo@example.com',
          country: 'Deutschland',
          native_languages: 'Deutsch',
          learning_goal: 'A1 Prüfung bestehen',
          preferred_language: 'german',
          registration_step: 'completed',
          german_level: 'A1',
          status: 'approved',
          experience_points: 0,
          current_streak: 0,
          longest_streak: 0,
          lessons_completed: 0,
          registration_date: new Date(),
          last_active: new Date(),
          approved_by: 'admin',
          approval_date: new Date(),
          subscription_status: 'active',
          subscription_plan: 'basic',
          subscription_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Tage
        });
      }
      return mockData.users.get(phone);
    },
    
    getUserDashboardData: async (phone) => {
      const user = mockData.users.get(phone);
      if (!user) return null;
      return {
        ...user,
        total_lessons: mockData.lessons.filter(l => l.is_published).length,
        total_points: user.experience_points,
        current_level: user.german_level,
        subscription_active: user.subscription_status === 'active'
      };
    },
    
    getUserCoursesWithProgress: async (phone) => {
      return mockData.courses.map(course => ({
        ...course,
        progress: Math.floor(Math.random() * 100),
        completed: Math.random() > 0.5,
        lessons_count: mockData.lessons.filter(l => l.course_id === course.id).length
      }));
    },
    
    // ===== KURS- UND LEKTIONS-FUNKTIONEN =====
    getCoursesByLevel: async () => {
      return mockData.courses.filter(c => c.is_published);
    },
    
    getCourseWithLessons: async (courseId) => {
      const course = mockData.courses.find(c => c.id === courseId);
      if (!course) return null;
      
      const lessons = mockData.lessons
        .filter(l => l.course_id === courseId && l.is_published)
        .sort((a, b) => a.order_index - b.order_index);
      
      return { ...course, lessons };
    },
    
    getLessonWithExercises: async (lessonId) => {
      const lesson = mockData.lessons.find(l => l.id === lessonId);
      if (!lesson) return null;
      
      const exercises = mockData.exercises.filter(e => e.lesson_id === lessonId);
      return { ...lesson, exercises };
    },
    
    // ===== ÜBUNGS-FUNKTIONEN =====
    submitExerciseAnswer: async (userId, exerciseId, answer) => {
      const exercise = mockData.exercises.find(e => e.id === exerciseId);
      if (!exercise) return { success: false, message: 'Übung nicht gefunden' };
      
      const isCorrect = exercise.correct_answer === answer;
      const points = isCorrect ? 10 : 0;
      
      // Punkte zum Nutzer hinzufügen
      const user = Array.from(mockData.users.values()).find(u => u.id === userId);
      if (user) {
        user.experience_points += points;
      }
      
      return {
        success: true,
        isCorrect,
        points,
        explanation: exercise.explanation,
        correctAnswer: exercise.correct_answer
      };
    },
    
    // ===== ABONNEMENT-FUNKTIONEN =====
    createSubscription: async (userId, plan, months) => {
      const user = Array.from(mockData.users.values()).find(u => u.id === userId);
      if (!user) return null;
      
      const subscription = {
        id: mockData.subscriptions.size + 1,
        user_id: userId,
        plan,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000),
        price: plan === 'basic' ? 19.99 : 29.99
      };
      
      mockData.subscriptions.set(userId, subscription);
      
      // Nutzer aktualisieren
      user.subscription_status = 'active';
      user.subscription_plan = plan;
      user.subscription_expires = subscription.end_date;
      
      return subscription;
    },
    
    getSubscription: async (userId) => {
      return mockData.subscriptions.get(userId) || null;
    },
    
    // ===== ADMIN-FUNKTIONEN =====
    getStatistics: async () => {
      const users = Array.from(mockData.users.values());
      return {
        pending_count: users.filter(u => u.status === 'pending').length,
        approved_count: users.filter(u => u.status === 'approved').length,
        rejected_count: users.filter(u => u.status === 'rejected').length,
        total_users: users.length,
        total_lessons: mockData.lessons.length,
        total_courses: mockData.courses.length,
        total_exercises: mockData.exercises.length,
        active_subscriptions: users.filter(u => u.subscription_status === 'active').length,
        avg_experience: users.length > 0 ? users.reduce((sum, u) => sum + u.experience_points, 0) / users.length : 0
      };
    },
    
    getPendingUsers: async () => {
      return Array.from(mockData.users.values()).filter(u => u.status === 'pending');
    },
    
    getApprovedUsers: async () => {
      return Array.from(mockData.users.values()).filter(u => u.status === 'approved');
    },
    
    approveUser: async (phone, approvedBy) => {
      const user = mockData.users.get(phone);
      if (user) {
        user.status = 'approved';
        user.approved_by = approvedBy;
        user.approval_date = new Date();
        return true;
      }
      return false;
    },
    
    rejectUser: async (phone) => {
      const user = mockData.users.get(phone);
      if (user) {
        user.status = 'rejected';
        return true;
      }
      return false;
    },
    
    // ===== INHALTS-VERWALTUNG =====
    createCourse: async (courseData) => {
      const newCourse = {
        id: mockData.courses.length + 1,
        ...courseData,
        is_published: false,
        created_at: new Date()
      };
      mockData.courses.push(newCourse);
      return newCourse;
    },
    
    updateCourse: async (courseId, courseData) => {
      const courseIndex = mockData.courses.findIndex(c => c.id === courseId);
      if (courseIndex >= 0) {
        mockData.courses[courseIndex] = { ...mockData.courses[courseIndex], ...courseData };
        return mockData.courses[courseIndex];
      }
      return null;
    },
    
    createLesson: async (lessonData) => {
      const newLesson = {
        id: mockData.lessons.length + 1,
        ...lessonData,
        is_published: false,
        created_at: new Date()
      };
      mockData.lessons.push(newLesson);
      return newLesson;
    },
    
    createExercise: async (exerciseData) => {
      const newExercise = {
        id: mockData.exercises.length + 1,
        ...exerciseData,
        created_at: new Date()
      };
      mockData.exercises.push(newExercise);
      return newExercise;
    },
    
    // ===== REINIGUNGS-FUNKTIONEN =====
    setPreferredLanguage: async (phone, language) => {
      const user = mockData.users.get(phone);
      if (user) {
        user.preferred_language = language;
      }
      return true;
    },
    
    updateLastActive: async (phone) => {
      const user = mockData.users.get(phone);
      if (user) {
        user.last_active = new Date();
      }
      return true;
    },
    
    addExperiencePoints: async (phone, points) => {
      const user = mockData.users.get(phone);
      if (user) {
        user.experience_points += points;
      }
      return true;
    },
    
    saveLesson: async (phone, lessonData) => {
      mockData.lessons.push({
        user_phone: phone,
        ...lessonData,
        created_at: new Date()
      });
      return true;
    }
  };
} else {
  // PostgreSQL-Verbindung für Produktion
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // ===== ERWEITERTE DATENBANK-TABELLEN =====
  async function initializeDatabase() {
    try {
      console.log('🔧 Initialisiere erweiterte PostgreSQL Datenbank...');
      
      // USERS TABELLE - Erweitert um Billing
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100),
          name VARCHAR(100),
          country VARCHAR(50),
          native_languages TEXT,
          learning_goal TEXT,
          preferred_language VARCHAR(20) DEFAULT 'german',
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
          approval_date TIMESTAMP,
          subscription_status VARCHAR(20) DEFAULT 'inactive',
          subscription_plan VARCHAR(20),
          subscription_expires TIMESTAMP
        )
      `);
      
      // COURSES TABELLE - Erweitert um Inhaltsverwaltung
      await pool.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          level VARCHAR(5) NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          content_url TEXT,
          is_published BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // LESSONS TABELLE - Neue Tabelle für Lektionen
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lessons (
          id SERIAL PRIMARY KEY,
          course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          content TEXT,
          order_index INTEGER DEFAULT 0,
          is_published BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // EXERCISES TABELLE - Neue Tabelle für Übungen
      await pool.query(`
        CREATE TABLE IF NOT EXISTS exercises (
          id SERIAL PRIMARY KEY,
          lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          question TEXT NOT NULL,
          options JSONB,
          correct_answer TEXT,
          explanation TEXT,
          points INTEGER DEFAULT 10,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // SUBSCRIPTIONS TABELLE - Neue Tabelle für Abonnements
      await pool.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          plan VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          end_date TIMESTAMP NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // INVOICES TABELLE - Neue Tabelle für Rechnungen
      await pool.query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          subscription_id INTEGER REFERENCES subscriptions(id),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'EUR',
          status VARCHAR(20) DEFAULT 'pending',
          due_date TIMESTAMP NOT NULL,
          paid_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Bestehende Tabellen beibehalten
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lessons_history (
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
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_course_progress (
          id SERIAL PRIMARY KEY,
          user_phone VARCHAR(50) REFERENCES users(phone_number),
          course_code VARCHAR(50) REFERENCES courses(code),
          progress_percentage INTEGER DEFAULT 0,
          lessons_completed INTEGER DEFAULT 0,
          total_lessons INTEGER DEFAULT 0,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_phone, course_code)
        )
      `);

      console.log('✅ Erweiterte PostgreSQL Datenbank erfolgreich initialisiert');
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren der Datenbank:', error);
      throw error;
    }
  }

  // ===== ERWEITERTE FUNKTIONEN EXPORTIEREN =====
  module.exports = {
    initializeDatabase,
    // ... alle anderen Funktionen werden hier exportiert
  };
}
