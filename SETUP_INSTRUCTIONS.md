# Student Information System - Setup Instructions

## Quick Start

### 1. Start the Backend Server

Open a terminal and navigate to the backend directory:

```bash
cd vulnerable-sic/backend
```

**First time setup** - Create/Reset the database:
```bash
node seed.js
```

**Start the backend server:**
```bash
node server.js
```

You should see:
```
Connected to SQLite DB at ./students.db
Vulnerable SIC backend listening on http://0.0.0.0:3000
```

**Keep this terminal open** - the server must be running for the frontend to work.

### 2. Start the Frontend

Open the frontend HTML file in your browser. You can:

**Option A: Use VS Code Live Server**
- Right-click on `vulnerable-sic/frontend/index.html`
- Select "Open with Live Server"

**Option B: Use Python Simple Server**
```bash
cd vulnerable-sic/frontend
python3 -m http.server 5500
```

**Option C: Open directly in browser**
- Just open `vulnerable-sic/frontend/index.html` in your browser
- Note: Some features may not work due to CORS if opened as `file://`

### 3. Login

Use any of these student credentials:

| Student ID | Password | Name |
|------------|----------|------|
| STU001 | rahul123 | Rahul Sharma |
| STU002 | priya123 | Priya Patel |
| STU003 | arjun123 | Arjun Reddy |
| STU010 | soni123 | Soni Kumar |
| ... | ... | ... |

**Admin Login:**
- Username: `admin`
- Password: `admin123`

## Troubleshooting

### "Connection error" when trying to login

1. **Check if backend is running:**
   - Make sure you see the "Vulnerable SIC backend listening" message
   - The backend should be running on port 3000

2. **Check the API URL:**
   - The frontend tries to connect to `http://localhost:3000/api`
   - If your backend is on a different machine, edit the API constant in `index.html`

3. **Check browser console:**
   - Press F12 to open developer tools
   - Look for CORS errors or connection errors in the Console tab

### Database not found

Run the seed script:
```bash
cd vulnerable-sic/backend
node seed.js
```

This will create the database with all student accounts.

## File Structure

```
Final_Ethical_hacking_project/
├── vulnerable-sic/
│   ├── backend/
│   │   ├── server.js          # Backend API server
│   │   ├── seed.js            # Database setup script
│   │   ├── db.js              # Database connection
│   │   ├── config.js          # Configuration
│   │   ├── students.db        # SQLite database (created after seed.js)
│   │   └── package.json       # Dependencies
│   └── frontend/
│       └── index.html         # Frontend application
```

## Features

- ✅ Student login with unique ID and password
- ✅ View personal information after login
- ✅ View attendance records
- ✅ View marks/grades
- ✅ View fee status
- ✅ View library books
- ✅ Profile management
- ✅ Dashboard with student-specific data

## Notes

- The backend must be running for the frontend to work
- All passwords are stored in plaintext (intentional for pentesting lab)
- The application has intentional vulnerabilities for security testing

