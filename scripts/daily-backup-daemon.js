const { runBackup } = require('./backup-db');

const DAY_MS = 24 * 60 * 60 * 1000;

function startDailyBackup() {
  runBackup();
  setInterval(runBackup, DAY_MS);
  console.log('Daily backup daemon started (runs every 24 hours).');
}

startDailyBackup();