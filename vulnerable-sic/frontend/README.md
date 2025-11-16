# Student Information System - Frontend

## Local Development Setup

### Prerequisites
- Backend server running on `http://localhost:3000`
- Web browser
- Live Server extension (VS Code) or any local web server

### Quick Start

1. **Start the backend server:**
   ```bash
   cd ../backend
   node server.js
   ```
   Backend will run on `http://localhost:3000`

2. **Open the frontend:**
   - Option A: Use VS Code Live Server
     - Right-click on `index.html`
     - Select "Open with Live Server"
   
   - Option B: Use Python HTTP Server
     ```bash
     python3 -m http.server 5500
     ```
     Then open: `http://localhost:5500`
   
   - Option C: Open directly in browser
     - Just open `index.html` in your browser
     - Note: Some features may not work due to CORS if opened as `file://`

3. **Login:**
   - Student ID: `STU001`
   - Password: `rahul123`

## Configuration

The API URL is configured in `config.js` and defaults to:
- `http://localhost:3000/api`

To change it, edit `config.js`:
```javascript
window.API_CONFIG = {
  baseUrl: 'http://localhost:3000/api'
};
```

## File Structure

```
frontend/
├── index.html      # Main application
├── config.js       # API configuration
├── .nojekyll       # GitHub Pages config (not needed for localhost)
└── README.md       # This file
```

## Troubleshooting

### Connection Error
- Make sure backend is running on port 3000
- Check browser console (F12) for errors
- Verify API URL in console: should show `http://localhost:3000/api`

### CORS Errors
- Make sure you're accessing via `http://localhost` or `http://127.0.0.1`
- Don't open as `file://` - use a local server

### Backend Not Found
- Check if backend is running: `curl http://localhost:3000/api/students`
- Verify port 3000 is not in use by another application
