const express = require('express');
const db = require('../db/connection');
const { BOOKING_SLOTS } = require('../constants');

const router = express.Router();

function isValidDate(dateValue) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || ''));
}

router.get('/schedule', (req, res) => {
  const date = String(req.query.date || '');
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD.' });
  }

  const rows = db
    .prepare(
      `SELECT a.id, a.date, a.time_slot AS timeSlot, a.symptoms, a.status, a.nurse_notes AS nurseNotes,
              u.email AS studentEmail, u.id AS studentId
       FROM Appointments a
       JOIN Users u ON u.id = a.student_id
       WHERE a.date = ?
       ORDER BY a.time_slot ASC`
    )
    .all(date);

  return res.json(rows);
});

router.patch('/appointments/:appointmentId', (req, res) => {
  const appointmentId = Number(req.params.appointmentId);
  const { status, nurseNotes } = req.body;

  if (!['Pending', 'Seen'].includes(String(status || ''))) {
    return res.status(400).json({ error: 'status must be Pending or Seen.' });
  }

  const result = db
    .prepare('UPDATE Appointments SET status = ?, nurse_notes = ? WHERE id = ?')
    .run(status, String(nurseNotes || ''), appointmentId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  return res.json({ message: 'Appointment updated.' });
});

router.get('/slots', (req, res) => {
  const date = String(req.query.date || '');
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD.' });
  }

  const configuredRows = db
    .prepare('SELECT time_slot AS timeSlot, is_open AS isOpen FROM Slot_Controls WHERE date = ?')
    .all(date);
  const configuredMap = new Map(configuredRows.map((row) => [row.timeSlot, Number(row.isOpen) === 1]));

  const slots = BOOKING_SLOTS.map((slot) => ({
    timeSlot: slot,
    isOpen: configuredMap.has(slot) ? configuredMap.get(slot) : true
  }));

  return res.json({ date, slots });
});

router.put('/slots', (req, res) => {
  const { date, timeSlot, isOpen } = req.body;

  if (!isValidDate(date) || !BOOKING_SLOTS.includes(String(timeSlot))) {
    return res.status(400).json({ error: 'Invalid date or timeSlot.' });
  }

  const openValue = isOpen ? 1 : 0;
  db.prepare(
    `INSERT INTO Slot_Controls (date, time_slot, is_open)
     VALUES (?, ?, ?)
     ON CONFLICT(date, time_slot)
     DO UPDATE SET is_open = excluded.is_open`
  ).run(date, timeSlot, openValue);

  return res.json({ message: 'Slot availability updated.' });
});

router.get('/trends', (req, res) => {
  const days = Math.max(1, Math.min(Number(req.query.days || 7), 30));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const rows = db
    .prepare(
      `SELECT symptom_type AS symptomType, COUNT(*) AS count
       FROM Trends
       WHERE timestamp >= ?
       GROUP BY symptom_type
       ORDER BY count DESC
       LIMIT 12`
    )
    .all(cutoff);

  return res.json({ days, trends: rows });
});

module.exports = router;