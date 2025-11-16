# Login Debugging Guide

## Quick Test Steps

### 1. Check Backend is Running
```bash
curl http://localhost:3000/api
```
Should return JSON with API endpoints.

### 2. Test Login Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"STU001","password":"rahul123"}'
```

Should return:
```json
{
  "token": "...",
  "username": "STU001",
  "role": "student",
  "student_id": "STU001",
  "student_info": {...}
}
```

### 3. Check Browser Console

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Try to login
4. Look for:
   - `Attempting login for: STU001`
   - `API endpoint: http://localhost:3000/api/login`
   - `Response status: 200`
   - `✅ Login response received:`

### 4. Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try to login
4. Find the request to `/api/login`
5. Click on it and check:
   - **Status:** Should be `200`
   - **Request Payload:** Should show `{"username":"STU001","password":"rahul123"}`
   - **Response:** Should show JSON with token and student_info

## Common Issues

### Issue: "Cannot GET /api"
**Solution:** This is normal! The `/api` endpoint now shows API info. Use `/api/login` for login.

### Issue: Login button does nothing
**Check:**
- Browser console for JavaScript errors
- Network tab to see if request is sent
- Backend is running on port 3000

### Issue: "Connection error"
**Check:**
- Backend is running: `curl http://localhost:3000/api/students`
- No firewall blocking port 3000
- Browser console for CORS errors

### Issue: "Invalid credentials"
**Check:**
- Username is uppercase: `STU001` (not `stu001`)
- Password is correct: `rahul123`
- No extra spaces in input fields

### Issue: Response received but page doesn't change
**Check:**
- Browser console for JavaScript errors after login
- Check if `data.token` exists in response
- Check if `goToPage('dashboardPage')` is being called

## Manual Test in Console

Open browser console (F12) and paste:

```javascript
fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'STU001', password: 'rahul123' })
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('✅ Success:', data);
  if (data.token) {
    console.log('Token received!');
    console.log('Student:', data.student_info);
  }
})
.catch(err => {
  console.error('❌ Error:', err);
});
```

If this works but the form doesn't, the issue is with the form submission.

## Expected Flow

1. User enters credentials
2. Form submits → `handleLogin()` called
3. Fetch request to `/api/login`
4. Backend responds with token + student_info
5. Frontend stores token in localStorage
6. Frontend hides login page, shows dashboard
7. Frontend loads student data

Check each step in browser console!

