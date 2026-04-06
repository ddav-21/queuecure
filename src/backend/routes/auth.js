const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/connection');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

router.post('/register/student', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    });
  }

  const existingUser = db.prepare('SELECT id FROM Users WHERE email = ?').get(normalizedEmail);

  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  try {
    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const result = db
      .prepare('INSERT INTO Users (email, password_hash, role) VALUES (?, ?, ?)')
      .run(normalizedEmail, passwordHash, 'Student');

    return res.status(201).json({
      message: 'Student account created successfully.',
      user: {
        id: result.lastInsertRowid,
        email: normalizedEmail,
        role: 'Student'
      }
    });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to create account at this time.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db
    .prepare('SELECT id, email, password_hash, role FROM Users WHERE email = ?')
    .get(normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid login credentials.' });
  }

  const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid login credentials.' });
  }

  return res.json({
    message: 'Login successful.',
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = router;