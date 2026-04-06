const express = require('express');
const path = require('path');

require('./db/connection');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const nurseRoutes = require('./routes/nurse');
const libraryRoutes = require('./routes/library');
const adminRoutes = require('./routes/admin');

const app = express();
const rootDir = path.join(__dirname, '..', '..');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'QueueCure API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(rootDir));

app.get(['/book', '/dashboard', '/nurse', '/library'], (_req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`QueueCure server running at http://localhost:${PORT}`);
});
