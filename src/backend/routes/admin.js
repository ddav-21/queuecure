const express = require('express');
const db = require('../db/connection');

const router = express.Router();
const allowedTables = ['Users', 'Appointments', 'Health_Library', 'Trends', 'Slot_Controls'];

router.get('/db', (req, res) => {
  const requestedTable = String(req.query.table || 'Users');
  const table = allowedTables.includes(requestedTable) ? requestedTable : 'Users';

  const summary = allowedTables.map((name) => {
    const row = db.prepare(`SELECT COUNT(*) AS total FROM ${name}`).get();
    return { table: name, rows: row.total };
  });

  const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 100`).all();
  return res.json({ table, summary, rows });
});

module.exports = router;