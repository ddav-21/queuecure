const { initializeDatabase } = require('./initDb');

const db = initializeDatabase();

module.exports = db;