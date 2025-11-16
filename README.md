# Student Information System - Localhost Deployment
--> after cloning the repo , make sure you install node modules in backend folder.
A web application for student information management with login functionality.

## Quick Start

### 1. Start Backend Server

```bash
cd vulnerable-sic/backend
node seed.js    # First time only - creates database
node server.js  # Start server
```

Backend will run on: `http://localhost:3000`

### 2. Open Frontend

**Option A: VS Code Live Server**
- Right-click on `vulnerable-sic/frontend/index.html`
- Select "Open with Live Server"

**Option B: Python HTTP Server**
```bash
cd vulnerable-sic/frontend
python3 -m http.server 5500
```
Then open: `http://localhost:5500`

**Option C: Direct Browser**
- Open `vulnerable-sic/frontend/index.html` in your browser

### 3. Login

Use any student credentials:
- **Student ID:** `STU001` | **Password:** `rahul123`
- **Student ID:** `STU002` | **Password:** `priya123`
- **Student ID:** `STU010` | **Password:** `soni123`

**Admin Login:**
- **Username:** `admin` | **Password:** `admin123`

## Project Structure

```
Final_Ethical_hacking_project/
├── vulnerable-sic/
│   ├── backend/
│   │   ├── server.js      # Backend API server
│   │   ├── seed.js         # Database setup
│   │   ├── db.js           # Database connection
│   │   ├── config.js       # Configuration
│   │   └── students.db     # SQLite database
│   └── frontend/
│       ├── index.html      # Frontend application
│       ├── config.js       # API configuration
│       └── README.md       # Frontend docs
├── README.md               # This file
└── START_BACKEND.sh        # Quick start script
```

## Features

- ✅ Student login with unique ID and password
- ✅ View personal information
- ✅ View attendance records
- ✅ View marks/grades
- ✅ View fee status
- ✅ View library books
- ✅ Profile management
- ✅ Dashboard with student-specific data

## Configuration

### Backend
- Port: `3000` (configured in `backend/config.js`)
- Database: SQLite (`students.db`)

### Frontend
- API URL: `http://localhost:3000/api` (configured in `frontend/config.js`)
- Can be served on any port (5500, 8000, etc.)

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Reset database if needed
cd vulnerable-sic/backend
rm students.db
node seed.js
node server.js
```

### Frontend can't connect
1. Make sure backend is running: `curl http://localhost:3000/api/students`
2. Check browser console (F12) for errors
3. Verify API URL in console shows: `http://localhost:3000/api`

### Login not working
- Check browser console (F12) for errors
- Verify credentials: `STU001` / `rahul123`
- Make sure backend is running

## Development

### Reset Database
```bash
cd vulnerable-sic/backend
node seed.js
```

### View Database
```bash
cd vulnerable-sic/backend
sqlite3 students.db
.tables
SELECT * FROM users LIMIT 5;
```

## Notes

- All passwords are stored in plaintext (intentional for pentesting lab)
- The application has intentional vulnerabilities for security testing
- Backend must be running for frontend to work
- Use localhost URLs only - no external deployment configured
