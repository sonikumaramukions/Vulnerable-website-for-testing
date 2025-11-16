# Login Troubleshooting Guide

## Quick Fixes

### 1. Check Browser Console (IMPORTANT!)
Press **F12** in your browser to open Developer Tools, then:
- Go to the **Console** tab
- Look for any red error messages
- Try logging in again and watch for errors

### 2. Verify Backend is Running
Open a terminal and check:
```bash
curl http://localhost:3000/api/students
```
If you get a JSON response, backend is working!

### 3. Test Login Directly
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"STU001","password":"rahul123"}'
```

### 4. Common Issues

**Issue: "Connection error" or "Failed to fetch"**
- ✅ Backend is running on port 3000
- ✅ Check browser console (F12) for CORS errors
- ✅ Try refreshing the page
- ✅ Make sure you're using the correct credentials

**Issue: "Invalid credentials"**
- Use: **STU001** / **rahul123**
- Or: **STU002** / **priya123**
- Make sure Student ID is uppercase: **STU001** (not stu001)

**Issue: Page loads but login doesn't work**
- Open browser console (F12)
- Look for JavaScript errors
- Check Network tab to see if request is being sent
- Verify API URL shows: `http://localhost:3000/api`

### 5. Manual Test

Open browser console (F12) and paste:
```javascript
fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'STU001', password: 'rahul123' })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

If this works, the issue is with the frontend code.
If this fails, the issue is with the backend or network.

### 6. Reset Everything

```bash
# Stop backend (Ctrl+C)
# Then restart:
cd /home/soni-lap/Desktop/Final_Ethical_hacking_project/vulnerable-sic/backend
node seed.js  # Reset database
node server.js  # Start server
```

Then refresh your browser page (Ctrl+F5 to hard refresh).

