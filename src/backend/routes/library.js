const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim();

  const clauses = [];
  const values = [];

  if (query) {
    clauses.push('(LOWER(title) LIKE ? OR LOWER(content_body) LIKE ? OR LOWER(COALESCE(source_name, "")) LIKE ?)');
    const pattern = `%${query}%`;
    values.push(pattern, pattern, pattern);
  }

  if (category) {
    clauses.push('category = ?');
    values.push(category);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT id, title, category, content_body AS contentBody,
              source_name AS sourceName, source_url AS sourceUrl, reviewed_on AS reviewedOn
       FROM Health_Library
       ${whereClause}
       ORDER BY title ASC`
    )
    .all(...values);

  const categories = db
    .prepare('SELECT DISTINCT category FROM Health_Library ORDER BY category ASC')
    .all()
    .map((row) => row.category);

  return res.json({ articles: rows, categories });
});

module.exports = router;
