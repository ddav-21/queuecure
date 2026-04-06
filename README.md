# QueueCure Digital Health Portal

QueueCure is a school clinic system for Gelan Special Boys' Boarding Secondary School.

## Features

- Student sign-up/login with `bcrypt` password hashing
- Custom React booking calendar with slot locking
- Student "My Status" page for symptoms and nurse notes
- Nurse Command Center for schedule + open/close slot controls
- Symptom trends (last 7 days)
- Searchable Health Library with WHO/CDC-backed entries and source links
- WHO/CDC-informed homepage briefings
- QR-ready booking route: `/book?location=Dorm8`
- Dark mode toggle (saved in `localStorage`)
- Mobile responsive layout
- Read-only database viewer (nurse tab)
- SQLite backup scripts

## Run (Beginner Friendly)

1. Open PowerShell in this folder:
`c:\Users\qero guest\Desktop\queuecure`
2. Install dependencies:
```powershell
npm.cmd install
```
3. Initialize database:
```powershell
npm.cmd run db:init
```
4. Start app:
```powershell
npm.cmd start
```
5. Open browser:
`http://localhost:3000`

## Demo Accounts

- Nurse
  - Email: `nurse@queuecure.school`
  - Password: `NursePass123`
- Student
  - Create via Sign Up in the app

## Database Viewer

- Login as nurse
- Click `DB Viewer` in the top nav
- Switch between tables to inspect rows

## Backup

- One-time backup:
```powershell
npm.cmd run backup
```
- Daily backup daemon:
```powershell
npm.cmd run backup:daemon
```

## Project Structure

- `index.html` - app entry
- `app.js` - React UI
- `styles.css` - aquamarine/blue styles + dark mode
- `server.js` - root launcher
- `src/backend/server.js` - Express app
- `src/backend/db/` - SQLite init + connection
- `src/backend/routes/` - auth, appointments, nurse, library, admin
- `scripts/` - db init and backups
- `data/queuecure.db` - SQLite database file
