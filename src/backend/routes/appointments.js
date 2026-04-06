const express = require('express');
const db = require('../db/connection');
const { BOOKING_SLOTS } = require('../constants');

const router = express.Router();

function isValidDate(dateValue) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || ''));
}

function normalizeSymptoms(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, ' ')
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function slotStateForDate(date) {
  const closedRows = db
    .prepare('SELECT time_slot, is_open FROM Slot_Controls WHERE date = ?')
    .all(date);
  const bookedRows = db
    .prepare('SELECT time_slot FROM Appointments WHERE date = ?')
    .all(date);

  const closedMap = new Map(closedRows.map((row) => [row.time_slot, Number(row.is_open) === 1]));
  const bookedSet = new Set(bookedRows.map((row) => row.time_slot));

  return BOOKING_SLOTS.map((slot) => {
    const isOpen = closedMap.has(slot) ? closedMap.get(slot) : true;
    return {
      timeSlot: slot,
      isOpen,
      isBooked: bookedSet.has(slot)
    };
  });
}

router.get('/slots', (req, res) => {
  const { date } = req.query;
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Query parameter "date" must be YYYY-MM-DD.' });
  }

  return res.json({ date, slots: slotStateForDate(date) });
});

router.post('/', (req, res) => {
  const { studentId, date, timeSlot, symptoms } = req.body;

  if (!studentId || !date || !timeSlot) {
    return res.status(400).json({ error: 'studentId, date, and timeSlot are required.' });
  }

  if (!isValidDate(date) || !BOOKING_SLOTS.includes(timeSlot)) {
    return res.status(400).json({ error: 'Invalid date or time slot.' });
  }

  const student = db
    .prepare('SELECT id, role FROM Users WHERE id = ?')
    .get(Number(studentId));

  if (!student || student.role !== 'Student') {
    return res.status(404).json({ error: 'Student account not found.' });
  }

  const configured = db
    .prepare('SELECT is_open FROM Slot_Controls WHERE date = ? AND time_slot = ?')
    .get(date, timeSlot);
  if (configured && Number(configured.is_open) === 0) {
    return res.status(409).json({ error: 'This slot is currently closed by the nurse.' });
  }

  const existing = db
    .prepare('SELECT id FROM Appointments WHERE date = ? AND time_slot = ?')
    .get(date, timeSlot);

  if (existing) {
    return res.status(409).json({ error: 'This slot has already been booked.' });
  }

  try {
    const insertAppointment = db.prepare(
      'INSERT INTO Appointments (student_id, date, time_slot, symptoms, status, nurse_notes) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = insertAppointment.run(
      Number(studentId),
      date,
      timeSlot,
      String(symptoms || '').trim(),
      'Pending',
      ''
    );

    const insertTrend = db.prepare('INSERT INTO Trends (symptom_type, timestamp) VALUES (?, ?)');
    const tokens = normalizeSymptoms(symptoms);
    const now = new Date().toISOString();

    for (const token of tokens.slice(0, 6)) {
      insertTrend.run(token, now);
    }

    return res.status(201).json({
      message: 'Appointment booked successfully.',
      appointmentId: result.lastInsertRowid
    });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to complete booking.' });
  }
});

router.get('/student/:studentId', (req, res) => {
  const studentId = Number(req.params.studentId);
  const rows = db
    .prepare(
      `SELECT id, date, time_slot AS timeSlot, symptoms, status, nurse_notes AS nurseNotes
       FROM Appointments
       WHERE student_id = ?
       ORDER BY date ASC, time_slot ASC`
    )
    .all(studentId);

  return res.json(rows);
});

router.patch('/:appointmentId/symptoms', (req, res) => {
  const appointmentId = Number(req.params.appointmentId);
  const { studentId, symptoms } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required.' });
  }

  const appointment = db
    .prepare('SELECT id, student_id FROM Appointments WHERE id = ?')
    .get(appointmentId);

  if (!appointment || appointment.student_id !== Number(studentId)) {
    return res.status(404).json({ error: 'Appointment not found for this student.' });
  }

  db.prepare('UPDATE Appointments SET symptoms = ? WHERE id = ?').run(String(symptoms || ''), appointmentId);

  return res.json({ message: 'Symptoms updated.' });
});

module.exports = router;