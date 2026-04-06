const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', '..', 'data');
const dbPath = path.join(dataDir, 'queuecure.db');

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Student', 'Nurse'))
  )`,
  `CREATE TABLE IF NOT EXISTS Appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    symptoms TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Seen')),
    nurse_notes TEXT,
    FOREIGN KEY (student_id) REFERENCES Users (id)
  )`,
  `CREATE TABLE IF NOT EXISTS Health_Library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content_body TEXT NOT NULL,
    source_name TEXT,
    source_url TEXT,
    reviewed_on TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS Trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symptom_type TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Slot_Controls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    is_open INTEGER NOT NULL CHECK (is_open IN (0, 1)),
    UNIQUE (date, time_slot)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_student_date ON Appointments (student_id, date)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot ON Appointments (date, time_slot)`,
  `CREATE INDEX IF NOT EXISTS idx_trends_timestamp ON Trends (timestamp)`
];

const trustedLibrary = [
  {
    title: 'Cold Vs Flu In A Dorm Setting',
    category: 'Common Respiratory & Viral Illnesses',
    contentBody:
      'Overview: Colds usually build slowly with runny nose and mild throat discomfort, while flu often starts suddenly with fever, body aches, and stronger fatigue.\n\nWhat to Expect: Congestion, cough, sore throat, low energy, and possible fever. Flu symptoms can feel more intense and reduce class focus quickly.\n\nDorm Care: Rest, hydrate often, use tissues, and avoid sharing cups. Keep windows or airflow open when possible.\n\nNurse Trigger: Book QueueCure if fever lasts more than 48 hours, symptoms worsen, or you are too weak for normal activity.\n\nRed Flag - Seek Immediate Help If: Breathing becomes difficult, chest pain appears, confusion starts, or fever is very high and not improving.',
    sourceName: 'WHO + CDC',
    sourceUrl: 'https://www.who.int/news-room/questions-and-answers/item/how-can-i-avoid-getting-the-flu | https://www.cdc.gov/flu/hcp/clinical-signs/index.html',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Sore Throat Self-Care And Strep Warning Signs',
    category: 'Common Respiratory & Viral Illnesses',
    contentBody:
      'Overview: Most sore throats improve with fluids and rest, but some can be bacterial and require nurse review.\n\nWhat to Expect: Pain when swallowing, throat dryness, mild cough, and occasional fever.\n\nDorm Care: Warm liquids, salt-water gargles, avoid shouting, and maintain hydration.\n\nNurse Trigger: Book if pain persists beyond two days, swallowing becomes difficult, or fever rises.\n\nRed Flag - Seek Immediate Help If: Breathing trouble, severe swelling, drooling with throat pain, or high fever with confusion.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Fever Management For Students',
    category: 'Common Respiratory & Viral Illnesses',
    contentBody:
      'Overview: Fever is a body defense response. Monitoring trend and hydration is more useful than panic.\n\nWhat to Expect: Body warmth, fatigue, chills, sweating, and lower appetite.\n\nDorm Care: Rest, increase water intake, wear light clothing, and recheck temperature every few hours.\n\nNurse Trigger: Book when fever stays high, lasts over 48 hours, or returns repeatedly.\n\nRed Flag - Seek Immediate Help If: Persistent very high fever, seizure, severe headache with stiff neck, or altered alertness.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Sports Injuries: Using R.I.C.E. Early',
    category: 'Physical Injuries & First Aid',
    contentBody:
      'Overview: Minor sprains and strains are common in active school settings and respond to early R.I.C.E. support.\n\nWhat to Expect: Pain, swelling, mild bruising, or reduced movement around the injured area.\n\nDorm Care: Rest the area, apply ice in short intervals, use compression wrap if available, and elevate the limb.\n\nNurse Trigger: Book if swelling increases, pain blocks walking, or motion does not improve after one day.\n\nRed Flag - Seek Immediate Help If: Bone looks deformed, severe uncontrolled pain, numbness, or inability to bear weight.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Minor Cuts And Abrasions In Shared Dorms',
    category: 'Physical Injuries & First Aid',
    contentBody:
      'Overview: Small cuts can become infected quickly in shared environments if not cleaned properly.\n\nWhat to Expect: Mild bleeding, surface pain, skin redness, and tenderness near the wound.\n\nDorm Care: Rinse with clean water, apply gentle antiseptic, use a clean bandage, and change dressing daily.\n\nNurse Trigger: Book if redness spreads, pain worsens, or wound remains open.\n\nRed Flag - Seek Immediate Help If: Bleeding does not stop, deep wound exposes tissue, fever starts, or red streaking appears.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Muscle Cramps And Fatigue Recovery',
    category: 'Physical Injuries & First Aid',
    contentBody:
      'Overview: Cramps often follow dehydration, overuse, poor warm-up, or mineral imbalance after sports.\n\nWhat to Expect: Sudden tight pain in calf, thigh, or foot with temporary stiffness.\n\nDorm Care: Stretch slowly, hydrate with water or electrolyte drinks, and pause intense activity.\n\nNurse Trigger: Book if cramps are repeated daily, painful at rest, or linked with dizziness.\n\nRed Flag - Seek Immediate Help If: Severe weakness, persistent vomiting, chest discomfort, or collapse occurs.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Headache And Migraine Relief For Students',
    category: 'Chronic & Recurring Conditions',
    contentBody:
      'Overview: Recurrent headaches can be linked to dehydration, eye strain, poor sleep, stress, or skipped meals.\n\nWhat to Expect: Pressure pain, sensitivity to light/noise, tiredness, or concentration drop.\n\nDorm Care: Drink water, reduce screen brightness, rest in a dark quiet space, and eat balanced meals.\n\nNurse Trigger: Book if headaches become frequent, severe, or interfere with lessons and sleep.\n\nRed Flag - Seek Immediate Help If: Sudden worst headache, repeated vomiting, fainting, or headache after head injury with confusion.',
    sourceName: 'CDC HEADS UP + QueueCure Clinical Guidance',
    sourceUrl: 'https://www.cdc.gov/heads-up/signs-symptoms/index.html',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Allergy Management In Dorm Rooms',
    category: 'Chronic & Recurring Conditions',
    contentBody:
      'Overview: Seasonal pollen and dorm dust can trigger sneezing, itchy eyes, and breathing discomfort.\n\nWhat to Expect: Runny nose, repeated sneezing, watery eyes, and mild throat irritation.\n\nDorm Care: Keep bedding clean, reduce dust buildup, and use prescribed antihistamines as directed.\n\nNurse Trigger: Book when symptoms disturb sleep, study, or do not improve with routine care.\n\nRed Flag - Seek Immediate Help If: Swelling of lips or face, wheezing, or sudden breathing difficulty occurs.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Asthma Awareness And Inhaler Readiness',
    category: 'Chronic & Recurring Conditions',
    contentBody:
      'Overview: Students with asthma should track triggers and keep rescue inhalers accessible at all times.\n\nWhat to Expect: Cough, chest tightness, wheeze, shortness of breath, especially with dust or exercise.\n\nDorm Care: Avoid smoke and dust triggers, follow inhaler plan, and monitor early symptoms.\n\nNurse Trigger: Book if inhaler use increases or nighttime breathing symptoms return.\n\nRed Flag - Seek Immediate Help If: Severe shortness of breath, inability to speak full sentences, or blue lips appear.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Skin Infections And Shared Shower Safety',
    category: 'Hygiene & Skin Care',
    contentBody:
      'Overview: Shared surfaces can increase spread of fungal skin infections and worsen acne irritation.\n\nWhat to Expect: Itchy patches, redness, scaling, painful pimples, or irritated skin folds.\n\nDorm Care: Keep skin dry, avoid sharing towels, wear slippers in showers, and use clean clothing daily.\n\nNurse Trigger: Book if rash spreads, pain increases, or there is no improvement after basic care.\n\nRed Flag - Seek Immediate Help If: Rapidly spreading redness, fever with skin pain, or pus with severe swelling develops.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Hand Hygiene To Prevent Dorm Flu Spikes',
    category: 'Hygiene & Skin Care',
    contentBody:
      'Overview: Frequent hand cleaning lowers transmission of respiratory and stomach infections in crowded settings.\n\nWhat to Expect: Better infection prevention when handwashing becomes routine before meals and after shared contact surfaces.\n\nDorm Care: Wash with soap for at least 20 seconds, dry hands well, and avoid touching face unnecessarily.\n\nNurse Trigger: Book if multiple classmates in your area have similar symptoms and your illness is worsening.\n\nRed Flag - Seek Immediate Help If: Dehydration signs, persistent vomiting, or breathing symptoms appear alongside fever.',
    sourceName: 'WHO + CDC',
    sourceUrl: 'https://www.who.int/news-room/questions-and-answers/item/how-can-i-avoid-getting-the-flu | https://www.cdc.gov/flu/hcp/clinical-signs/index.html',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Stress And Exam Anxiety Recovery Habits',
    category: 'Mental Health & Wellness',
    contentBody:
      'Overview: Academic pressure can cause emotional overload, concentration decline, and sleep disruption.\n\nWhat to Expect: Worry, irritability, racing thoughts, and feeling mentally exhausted.\n\nDorm Care: Break tasks into small steps, use breathing resets, short walks, and peer check-ins.\n\nNurse Trigger: Book if stress affects appetite, sleep, attendance, or mood for several days.\n\nRed Flag - Seek Immediate Help If: Panic symptoms escalate, self-harm thoughts occur, or emotional distress becomes overwhelming.',
    sourceName: 'WHO',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Sleep Hygiene In Boarding Dorms',
    category: 'Mental Health & Wellness',
    contentBody:
      'Overview: Consistent sleep protects immunity, memory, and emotional regulation during school terms.\n\nWhat to Expect: Poor sleep can trigger daytime fatigue, headaches, low mood, and slower study performance.\n\nDorm Care: Keep a regular sleep time, limit screens before bed, and reduce caffeine late in the day.\n\nNurse Trigger: Book if sleep problems continue beyond one week or impair daily functioning.\n\nRed Flag - Seek Immediate Help If: Extreme daytime drowsiness, confusion episodes, or severe mood changes appear.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  },
  {
    title: 'Hydration For Energy, Focus, And Recovery',
    category: 'Mental Health & Wellness',
    contentBody:
      'Overview: Mild dehydration can worsen headaches, fatigue, and concentration problems in class.\n\nWhat to Expect: Dry mouth, headache, low energy, reduced focus, and dark urine.\n\nDorm Care: Drink water regularly through the day, especially after exercise and during hot weather.\n\nNurse Trigger: Book if dizziness, repeated headaches, or weakness persists despite hydration.\n\nRed Flag - Seek Immediate Help If: Fainting, severe vomiting, or signs of heat illness occur.',
    sourceName: 'QueueCure Clinical Guidance',
    sourceUrl: '',
    reviewedOn: '2026-04-06'
  }
];

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function ensureColumn(db, table, columnName, sqlType) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);
  if (!hasColumn) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnName} ${sqlType}`).run();
  }
}

function seedLibrary(db) {
  ensureColumn(db, 'Health_Library', 'source_name', 'TEXT');
  ensureColumn(db, 'Health_Library', 'source_url', 'TEXT');
  ensureColumn(db, 'Health_Library', 'reviewed_on', 'TEXT');

  const legacyTitles = [
    'Flu Basics For Boarding Students',
    'Headache Recovery Checklist',
    'Allergy Relief At School',
    'Minor Injury Self-Care',
    'Seasonal Flu: Symptoms, Recovery, And Prevention',
    'When A Head Injury Might Be A Concussion',
    'Adolescent Mental Health: Early Support Matters',
    'Vaccines Protect Individuals And Dorm Communities'
  ];

  const removeLegacy = db.prepare('DELETE FROM Health_Library WHERE title = ?');
  for (const title of legacyTitles) {
    removeLegacy.run(title);
  }

  const findExisting = db.prepare('SELECT id FROM Health_Library WHERE title = ?');
  const insert = db.prepare(
    `INSERT INTO Health_Library (title, category, content_body, source_name, source_url, reviewed_on)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const update = db.prepare(
    `UPDATE Health_Library
     SET category = ?, content_body = ?, source_name = ?, source_url = ?, reviewed_on = ?
     WHERE id = ?`
  );

  for (const article of trustedLibrary) {
    const existing = findExisting.get(article.title);
    if (!existing) {
      insert.run(
        article.title,
        article.category,
        article.contentBody,
        article.sourceName,
        article.sourceUrl,
        article.reviewedOn
      );
    } else {
      update.run(
        article.category,
        article.contentBody,
        article.sourceName,
        article.sourceUrl,
        article.reviewedOn,
        existing.id
      );
    }
  }
}

function seedNurse(db) {
  const nurseEmail = 'nurse@queuecure.school';
  const existing = db.prepare('SELECT id FROM Users WHERE email = ?').get(nurseEmail);
  if (existing) {
    return;
  }

  const hash = bcrypt.hashSync('NursePass123', 10);
  db.prepare('INSERT INTO Users (email, password_hash, role) VALUES (?, ?, ?)').run(
    nurseEmail,
    hash,
    'Nurse'
  );
}

function initializeDatabase() {
  ensureDataDir();
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrate = db.transaction(() => {
    for (const statement of schemaStatements) {
      db.prepare(statement).run();
    }

    seedLibrary(db);
    seedNurse(db);
  });

  migrate();
  return db;
}

module.exports = {
  dbPath,
  initializeDatabase
};
