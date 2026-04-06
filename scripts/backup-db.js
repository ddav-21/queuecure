const fs = require('fs');
const path = require('path');

const sourceDb = path.join(__dirname, '..', 'data', 'queuecure.db');
const backupDir = path.join(__dirname, '..', 'backups');

function timestampLabel() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}

function runBackup() {
  if (!fs.existsSync(sourceDb)) {
    throw new Error(`Database file not found at ${sourceDb}. Run npm run db:init first.`);
  }

  fs.mkdirSync(backupDir, { recursive: true });
  const destination = path.join(backupDir, `queuecure-${timestampLabel()}.db`);
  fs.copyFileSync(sourceDb, destination);
  console.log(`Backup created: ${destination}`);
}

if (require.main === module) {
  runBackup();
}

module.exports = { runBackup };