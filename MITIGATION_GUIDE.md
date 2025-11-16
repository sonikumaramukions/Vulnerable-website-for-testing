# Security Mitigation Guide
## Tripati Group of Institutions - Student Information System

This document provides comprehensive mitigation strategies for all vulnerabilities identified in the application.

---

## 🔒 1. SQL INJECTION (SQLi) MITIGATION

### Problem
SQL queries are constructed by directly concatenating user input, allowing attackers to inject malicious SQL code.

### Vulnerable Code Example:
```javascript
const sql = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
```

### Solution: Use Parameterized Queries

**Before (Vulnerable):**
```javascript
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  db.get(sql, (err, user) => { ... });
});
```

**After (Secure):**
```javascript
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username=? AND password=?`;
  db.get(sql, [username, password], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    // ... rest of code
  });
});
```

### Implementation Steps:
1. **Replace all string concatenation** with parameterized queries
2. **Use placeholders** (`?` for SQLite, `$1, $2` for PostgreSQL, `@param` for MySQL)
3. **Validate input** before database queries
4. **Use ORM/Query Builders** (e.g., Sequelize, TypeORM) for additional protection

### Code Changes Required:
- `/api/login` - Use parameterized queries
- `/api/register` - Use parameterized queries
- `/api/student/marks/:id` - Use parameterized queries
- `/api/student/attendance/:id` - Use parameterized queries
- `/api/student/search` - Use parameterized queries
- `/api/library/search` - Use parameterized queries
- `/api/feedback` - Use parameterized queries
- `/api/student/profile/:id` - Use parameterized queries

---

## 🔒 2. IDOR (Insecure Direct Object Reference) MITIGATION

### Problem
No authorization checks to verify if a user has permission to access/modify specific resources.

### Vulnerable Code Example:
```javascript
app.get('/api/student/attendance/:id', (req, res) => {
  const id = req.params.id; // No check if user owns this ID
  db.all(`SELECT * FROM attendance WHERE student_id='${id}'`, ...);
});
```

### Solution: Implement Authorization Checks

**Before (Vulnerable):**
```javascript
app.get('/api/student/attendance/:id', (req, res) => {
  const id = req.params.id;
  db.all(`SELECT * FROM attendance WHERE student_id='${id}'`, ...);
});
```

**After (Secure):**
```javascript
app.get('/api/student/attendance/:id', (req, res) => {
  const id = req.params.id;
  const userId = req.user.student_id; // From authenticated session
  
  // Authorization check
  if (req.user.role !== 'admin' && userId !== id) {
    return res.status(403).json({ error: 'Forbidden: Access denied' });
  }
  
  db.all(`SELECT * FROM attendance WHERE student_id=?`, [id], ...);
});
```

### Implementation Steps:
1. **Extract user identity** from authenticated session/token
2. **Check ownership** before allowing access
3. **Implement role-based access control (RBAC)**
4. **Use middleware** for authorization checks

### Middleware Example:
```javascript
function checkOwnership(req, res, next) {
  const requestedId = req.params.id;
  const userId = req.user.student_id;
  const userRole = req.user.role;
  
  if (userRole === 'admin') {
    return next(); // Admins can access all
  }
  
  if (userId !== requestedId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

// Usage
app.get('/api/student/attendance/:id', authenticate, checkOwnership, (req, res) => {
  // Handler code
});
```

---

## 🔒 3. CROSS-SITE SCRIPTING (XSS) MITIGATION

### Problem
User input is rendered without sanitization, allowing script injection.

### Vulnerable Code Example:
```javascript
res.send(`<div>${userInput}</div>`); // XSS if userInput contains <script>
```

### Solution: Input Sanitization & Output Encoding

**Before (Vulnerable):**
```javascript
app.post('/api/feedback', (req, res) => {
  const { comment } = req.body;
  db.run(`INSERT INTO comments(comment) VALUES('${comment}')`, ...);
  // Later rendered as: <div>${comment}</div>
});
```

**After (Secure):**
```javascript
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

app.post('/api/feedback', (req, res) => {
  const { comment } = req.body;
  
  // Sanitize input
  const sanitizedComment = DOMPurify.sanitize(comment, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  });
  
  // Validate length
  if (sanitizedComment.length > 1000) {
    return res.status(400).json({ error: 'Comment too long' });
  }
  
  db.run(`INSERT INTO comments(comment) VALUES(?)`, [sanitizedComment], ...);
});
```

### Frontend Protection:
```javascript
// Use textContent instead of innerHTML
element.textContent = userInput; // Safe

// Or use DOMPurify for HTML content
element.innerHTML = DOMPurify.sanitize(userInput);
```

### Implementation Steps:
1. **Install sanitization library**: `npm install isomorphic-dompurify`
2. **Sanitize all user input** before storing
3. **Encode output** when rendering (use textContent, not innerHTML)
4. **Set Content Security Policy (CSP)** headers
5. **Validate input length** and format

### CSP Header Example:
```javascript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  next();
});
```

---

## 🔒 4. FILE UPLOAD VULNERABILITIES MITIGATION

### Problem
Files can be uploaded without validation of type, size, or content.

### Vulnerable Code Example:
```javascript
app.post('/api/student/upload-photo', (req, res) => {
  const photo = req.files.photo;
  const savePath = path.join(config.uploadsDir, photo.name);
  photo.mv(savePath, ...); // No validation
});
```

### Solution: Strict File Validation

**After (Secure):**
```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

app.post('/api/student/upload-photo', (req, res) => {
  if (!req.files || !req.files.photo) {
    return res.status(400).json({ error: 'No file' });
  }
  
  const photo = req.files.photo;
  
  // 1. Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(photo.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  
  // 2. Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (photo.size > maxSize) {
    return res.status(400).json({ error: 'File too large' });
  }
  
  // 3. Generate safe filename
  const ext = path.extname(photo.name).toLowerCase();
  const safeFilename = crypto.randomBytes(16).toString('hex') + ext;
  const savePath = path.join(config.uploadsDir, safeFilename);
  
  // 4. Validate file content (check magic bytes)
  const fileBuffer = photo.data;
  const isImage = fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8; // JPEG
  || (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50); // PNG
  
  if (!isImage) {
    return res.status(400).json({ error: 'Invalid file content' });
  }
  
  // 5. Save file
  photo.mv(savePath, (err) => {
    if (err) return res.status(500).json({ error: 'Upload failed' });
    res.json({ status: 'uploaded', path: `/uploads/${safeFilename}` });
  });
});
```

### Implementation Steps:
1. **Whitelist allowed file types** (MIME types)
2. **Validate file size** limits
3. **Generate random filenames** (prevent path traversal)
4. **Scan file content** (magic bytes, not just extension)
5. **Store files outside web root** if possible
6. **Use virus scanning** for production

---

## 🔒 5. COMMAND INJECTION MITIGATION

### Problem
User input is directly used in system commands without sanitization.

### Vulnerable Code Example:
```javascript
const cmd = `cat ${savePath} | awk -F, '{print $0}'`;
exec(cmd, ...);
```

### Solution: Avoid Shell Commands, Use Libraries

**Before (Vulnerable):**
```javascript
const cmd = `cat ${savePath}`;
exec(cmd, (err, stdout) => { ... });
```

**After (Secure):**
```javascript
// Option 1: Use file system operations instead
const fs = require('fs');
const csv = require('csv-parser');

fs.createReadStream(savePath)
  .pipe(csv())
  .on('data', (row) => {
    // Process CSV row
  });

// Option 2: If shell command is necessary, use execFile with arguments
const { execFile } = require('child_process');
execFile('cat', [savePath], (err, stdout) => {
  // Safe - arguments are properly escaped
});
```

### Implementation Steps:
1. **Avoid shell commands** entirely when possible
2. **Use libraries** for file processing (csv-parser, xlsx, etc.)
3. **If necessary, use execFile** instead of exec
4. **Validate and sanitize** all inputs
5. **Run with least privileges** (non-root user)

---

## 🔒 6. INFORMATION DISCLOSURE MITIGATION

### Problem
Sensitive information exposed through endpoints, error messages, or logs.

### Solutions:

#### 6.1 Secure Admin Endpoints
```javascript
// Add authentication middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  // Only admins can access
});
```

#### 6.2 Sanitize Error Messages
```javascript
// Before
res.status(500).json({ error: err.message }); // Exposes SQL errors

// After
if (process.env.NODE_ENV === 'production') {
  res.status(500).json({ error: 'Internal server error' });
} else {
  res.status(500).json({ error: err.message }); // Only in development
}
```

#### 6.3 Hash Passwords
```javascript
const bcrypt = require('bcrypt');

// Before storing
const hashedPassword = await bcrypt.hash(password, 10);

// When checking
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### 6.4 Secure Logging
```javascript
// Don't log sensitive data
logRequest(userId, 'action', endpoint, ip, sanitizeData(data));
```

---

## 🔒 7. AUTHENTICATION & SESSION MANAGEMENT MITIGATION

### Problem
Predictable tokens, plaintext passwords, weak session management.

### Solutions:

#### 7.1 Use Secure Tokens (JWT)
```javascript
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### 7.2 Hash Passwords
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Registration
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Login
const user = await db.get('SELECT * FROM users WHERE username=?', [username]);
const isValid = await bcrypt.compare(password, user.password);
```

#### 7.3 Implement Session Management
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // Prevent XSS
    maxAge: 3600000, // 1 hour
    sameSite: 'strict' // CSRF protection
  }
}));
```

---

## 🔒 8. CSRF (Cross-Site Request Forgery) MITIGATION

### Problem
No protection against CSRF attacks on state-changing operations.

### Solution: CSRF Tokens

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Generate token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protect routes
app.post('/api/student/profile/:id', 
  authenticate, 
  csrfProtection, 
  (req, res) => {
    // Handler code
  }
);
```

### Frontend Implementation:
```javascript
// Get CSRF token on page load
fetch('/api/csrf-token')
  .then(r => r.json())
  .then(data => {
    csrfToken = data.csrfToken;
  });

// Include in requests
fetch('/api/student/profile/STU001', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

---

## 🔒 9. PATH TRAVERSAL MITIGATION

### Problem
User input used in file paths without validation.

### Solution: Path Validation

```javascript
const path = require('path');

app.get('/api/file', (req, res) => {
  const userPath = req.query.path;
  
  // Resolve and validate path
  const resolvedPath = path.resolve(config.uploadsDir, userPath);
  const basePath = path.resolve(config.uploadsDir);
  
  // Ensure path is within allowed directory
  if (!resolvedPath.startsWith(basePath)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.sendFile(resolvedPath);
});
```

---

## 🔒 10. INPUT VALIDATION & SANITIZATION

### General Principles:

1. **Validate on Server Side** (never trust client)
2. **Whitelist, don't blacklist** (allow only known good)
3. **Validate type, length, format**
4. **Sanitize before processing**
5. **Use validation libraries**

### Example Validation Middleware:
```javascript
const validator = require('validator');

function validateStudentId(req, res, next) {
  const id = req.params.id;
  
  if (!id || !id.match(/^STU\d{3}$/)) {
    return res.status(400).json({ error: 'Invalid student ID format' });
  }
  
  next();
}

app.get('/api/student/:id', validateStudentId, handler);
```

---

## 🔒 11. SECURITY HEADERS

### Implement Security Headers:
```javascript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  
  // Strict Transport Security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});
```

---

## 🔒 12. RATE LIMITING

### Prevent Brute Force Attacks:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later'
});

app.post('/api/login', loginLimiter, handler);
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Immediate Actions:
- [ ] Replace all SQL string concatenation with parameterized queries
- [ ] Implement authentication middleware
- [ ] Add authorization checks to all endpoints
- [ ] Hash all passwords using bcrypt
- [ ] Sanitize all user input
- [ ] Implement CSRF protection
- [ ] Add input validation
- [ ] Secure file uploads
- [ ] Remove command injection vulnerabilities
- [ ] Add security headers
- [ ] Implement rate limiting
- [ ] Sanitize error messages
- [ ] Secure admin endpoints

### Long-term Improvements:
- [ ] Implement comprehensive logging
- [ ] Add security monitoring
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Security training for developers
- [ ] Automated security scanning in CI/CD
- [ ] Bug bounty program
- [ ] Security incident response plan

---

## 🛠️ RECOMMENDED LIBRARIES

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "isomorphic-dompurify": "^2.9.0",
    "csurf": "^1.11.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "express-session": "^1.17.3"
  }
}
```

---

## 📚 ADDITIONAL RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Remember:** Security is an ongoing process, not a one-time fix. Regular updates and security audits are essential.

