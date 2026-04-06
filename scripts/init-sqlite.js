const { dbPath, initializeDatabase } = require('../src/backend/db/initDb');

const db = initializeDatabase();
db.close();

console.log(`QueueCure SQLite database initialized at: ${dbPath}`);