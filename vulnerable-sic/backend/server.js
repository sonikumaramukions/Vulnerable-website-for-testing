/**
 * server.js
 * Vulnerable backend for Student Information Center (lab)
 *
 * Intentional vulnerabilities:
 * - SQL injection (unparameterized queries)
 * - IDORs (no ownership checks)
 * - Unrestricted file upload
 * - Command injection in CSV processing
 * - Permissive CORS
 * - Exposed logs and plaintext passwords
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const db = require('./db');
const config = require('./config');

// Prevent server crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit - keep server running for testing
  // In production, you would want to exit: process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running for testing
});

const app = express();
// CORS configuration - localhost only
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ensure uploads dir exists
if (!fs.existsSync(config.uploadsDir)) fs.mkdirSync(config.uploadsDir, { recursive: true });

// Simple logger to DB (insecure: logs request bodies)
function logRequest(user_id, action, endpoint, ip, data) {
  const t = new Date().toISOString();
  const safeData = typeof data === 'string' ? data : JSON.stringify(data);
  const q = `INSERT INTO logs(user_id,action,endpoint,ip_address,timestamp,request_data) VALUES('${user_id}','${action}','${endpoint}','${ip}','${t}','${safeData}')`;
  db.run(q);
}

// ---------- AUTH / LOGIN (SQLi vulnerable, plaintext passwords) ----------
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const sql = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    db.get(sql, (err, user) => {
      if (err) {
        console.error('Login SQL Error:', err.message);
        logRequest(username || 'unknown', 'login_error', '/api/login', req.ip, err.message);
        return res.json({ error: 'internal' });
      }
    if (user) {
      const token = Buffer.from(username + '::' + Date.now()).toString('base64'); // predictable token
      logRequest(username, 'login_success', '/api/login', req.ip, 'token:' + token);
      
      // If student, fetch their information
      if (user.role === 'student' && user.student_id) {
        db.get(`SELECT * FROM students WHERE id='${user.student_id}'`, (err, student) => {
          if (err || !student) {
            return res.json({ token, username: user.username, role: user.role });
          }
          return res.json({ 
            token, 
            username: user.username, 
            role: user.role,
            student_id: user.student_id,
            student_info: student
          });
        });
      } else {
        return res.json({ token, username: user.username, role: user.role });
      }
      } else {
        logRequest(username || 'unknown', 'login_fail', '/api/login', req.ip, `attempt:${username}`);
        return res.json({ error: 'Invalid credentials' });
      }
    });
  } catch (err) {
    console.error('Login handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- REGISTER (SQLi) ----------
app.post('/api/register', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const sql = `INSERT INTO users(username,password,role) VALUES('${username}','${password}','student')`;
    db.run(sql, function(err) {
      if (err) {
        console.error('Register SQL Error:', err.message);
        logRequest(username || 'unknown', 'register_error', '/api/register', req.ip, err.message);
        return res.json({ error: 'Could not register', details: err.message });
      }
      logRequest(username, 'register', '/api/register', req.ip, `id:${this.lastID}`);
      res.json({ status: 'registered', id: this.lastID });
    });
  } catch (err) {
    console.error('Register handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- PUBLIC: list students (no auth) ----------
app.get('/api/students', (req, res) => {
  try {
    db.all("SELECT id,name,dept,semester,city,cgpa FROM students", (err, rows) => {
      if (err) {
        console.error('Students list SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Students list handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- IDOR: student profile (no ownership checks) ----------
app.get('/api/student/profile/:id', (req, res) => {
  try {
    const id = req.params.id; // vulnerable to IDOR
    db.get(`SELECT * FROM students WHERE id='${id}'`, (err, row) => {
      if (err) {
        console.error('Profile SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(row || {});
    });
  } catch (err) {
    console.error('Profile handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Update profile (no ownership check) ----------
app.put('/api/student/profile/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { name, phone, email, city, cgpa } = req.body || {};
    // mass assignment allowed
    const sql = `UPDATE students SET name='${name}', phone='${phone}', email='${email}', city='${city}', cgpa=${cgpa} WHERE id='${id}'`;
    db.run(sql, function(err) {
      if (err) {
        console.error('Profile update SQL Error:', err.message);
        logRequest('admin', 'profile_update_error', `/api/student/profile/${id}`, req.ip, err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      logRequest('admin', 'profile_update', `/api/student/profile/${id}`, req.ip, JSON.stringify(req.body));
      res.json({ status: 'updated', changes: this.changes });
    });
  } catch (err) {
    console.error('Profile update handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Upload profile photo (unrestricted) ----------
app.post('/api/student/upload-photo', (req, res) => {
  if (!req.files || !req.files.photo) return res.status(400).json({ error: 'No file' });
  const photo = req.files.photo;
  const savePath = path.join(config.uploadsDir, photo.name);
  photo.mv(savePath, (err) => {
    if (err) return res.status(500).json({ error: 'upload failed' });
    db.run(`INSERT INTO uploads(filename,uploader,uploaded_at) VALUES('${photo.name}','unknown','${new Date().toISOString()}')`);
    res.json({ status: 'uploaded', path: `/uploads/${photo.name}` });
  });
});

// ---------- Student marks (SQLi vulnerable via id param) ----------
app.get('/api/student/marks/:id', (req, res) => {
  try {
    const id = req.params.id;
    // intentionally concatenated SQL to allow SQLi
    db.all(`SELECT m.*, s.subject_name FROM marks m JOIN subjects s ON m.subject_id=s.subject_id WHERE student_id='${id}'`, (err, rows) => {
      if (err) {
        console.error('Marks SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Marks handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Attendance (no auth) ----------
app.get('/api/student/attendance/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.all(`SELECT a.*, s.subject_name FROM attendance a LEFT JOIN subjects s ON a.subject_id = s.subject_id WHERE a.student_id='${id}' ORDER BY a.date DESC`, (err, rows) => {
      if (err) {
        console.error('Attendance SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Attendance handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Fees info (reveals payment details) ----------
app.get('/api/student/fees/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.all(`SELECT * FROM fees WHERE student_id='${id}' ORDER BY semester`, (err, rows) => {
      if (err) {
        console.error('Fees SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Fees handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Student search (POST, SQLi) ----------
app.post('/api/student/search', (req, res) => {
  try {
    const q = req.body.query || '';
    // vulnerable to SQLi
    db.all(`SELECT id,name,dept FROM students WHERE name LIKE '%${q}%' OR id LIKE '%${q}%'`, (err, rows) => {
      if (err) {
        console.error('Search SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Search handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Library: books for a student (IDOR) ----------
app.get('/api/library/books', (req, res) => {
  try {
    const sid = req.query.student_id || '';
    db.all(`SELECT * FROM library WHERE student_id='${sid}'`, (err, rows) => {
      if (err) {
        console.error('Library books SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Library books handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Library catalog search (SQLi) ----------
app.get('/api/library/search', (req, res) => {
  try {
    const q = req.query.q || '';
    db.all(`SELECT * FROM library WHERE title LIKE '%${q}%' OR book_id LIKE '%${q}%'`, (err, rows) => {
      if (err) {
        console.error('Library search SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Library search handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Reserve book (no auth) ----------
app.post('/api/library/reserve', (req, res) => {
  const { book_id, student_id } = req.body || {};
  const now = new Date().toISOString();
  db.run(`INSERT INTO library(student_id,book_id,title,issue_date,due_date,fine) VALUES('${student_id}','${book_id}','reserved-${book_id}','${now}','${now}',0)`);
  logRequest(student_id || 'unknown', 'reserve_book', '/api/library/reserve', req.ip, JSON.stringify(req.body));
  res.json({ status: 'reserved' });
});

// ---------- Admin: Add student (no CSRF) ----------
app.post('/api/admin/student/add', (req, res) => {
  const { id, name, age, dept, semester, batch, phone, email, city } = req.body || {};
  // no validation; vulnerable to SQLi and mass assignment
  const sql = `INSERT INTO students(id,name,age,dept,semester,batch,phone,email,city,cgpa) VALUES('${id}','${name}',${age},'${dept}',${semester},${batch},'${phone}','${email}','${city}',0)`;
  db.run(sql, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logRequest('admin', 'add_student', '/api/admin/student/add', req.ip, JSON.stringify(req.body));
    res.json({ status: 'added', id: id });
  });
});

// ---------- Admin: Edit student (mass assignment vuln) ----------
app.put('/api/admin/student/edit/:id', (req, res) => {
  const id = req.params.id;
  // allow any fields passed in body to be set -- mass assignment
  const updates = Object.keys(req.body).map(k => `${k}='${req.body[k]}'`).join(',');
  const sql = `UPDATE students SET ${updates} WHERE id='${id}'`;
  db.run(sql, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logRequest('admin', 'edit_student', `/api/admin/student/edit/${id}`, req.ip, JSON.stringify(req.body));
    res.json({ status: 'updated', changes: this.changes });
  });
});

// ---------- Admin: Delete student (no authorization) ----------
app.delete('/api/admin/student/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM students WHERE id='${id}'`, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logRequest('admin', 'delete_student', `/api/admin/student/${id}`, req.ip, `deleted`);
    res.json({ status: 'deleted', id });
  });
});

// ---------- Admin: Upload marks CSV (command injection vulnerability) ----------
app.post('/api/admin/marks/upload', (req, res) => {
  if (!req.files || !req.files.csv) return res.status(400).json({ error: 'No CSV uploaded' });
  const csv = req.files.csv;
  const savePath = path.join(config.uploadsDir, csv.name);
  csv.mv(savePath, (err) => {
    if (err) return res.status(500).json({ error: 'upload failed' });
    // intentionally run a shell command to parse/process CSV (dangerous)
    // NOTE: This is intentionally vulnerable to command injection via crafted filenames or content
    const cmd = `cat ${savePath} | awk -F, '{print $0}'`; // harmless-looking, but in real vuln you might exec unescaped content
    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      db.run(`INSERT INTO uploads(filename,uploader,uploaded_at) VALUES('${csv.name}','admin','${new Date().toISOString()}')`);
      logRequest('admin','marks_upload','/api/admin/marks/upload', req.ip, `file:${csv.name}`);
      return res.json({ status: 'uploaded', output: stdout || stderr });
    });
  });
});

// ---------- Admin: Bulk attendance (allows backdating) ----------
app.post('/api/admin/attendance/bulk', (req, res) => {
  const { date, subject_id, status } = req.body || {};
  // Insecure: apply to all students without validation
  db.all("SELECT id FROM students", (err, rows) => {
    if (err) return res.status(500).json({ error: 'db' });
    rows.forEach(r => {
      db.run(`INSERT INTO attendance(student_id,subject_id,date,status,marked_by) VALUES('${r.id}','${subject_id}','${date}','${status}','admin')`);
    });
    logRequest('admin','bulk_attendance','/api/admin/attendance/bulk', req.ip, JSON.stringify(req.body));
    res.json({ status: 'applied', count: rows.length });
  });
});

// ---------- Admin: Reports (info disclosure) ----------
app.get('/api/admin/reports/all', (req, res) => {
  // dump some aggregated info (no auth)
  db.all("SELECT dept, COUNT(*) as count FROM students GROUP BY dept", (err, rows) => {
    if (err) return res.status(500).json({ error: 'db' });
    res.json({ dept_distribution: rows });
  });
});

// ---------- Admin: Logs (exposed) ----------
app.get('/api/admin/logs', (req, res) => {
  try {
    db.all("SELECT * FROM logs ORDER BY id DESC LIMIT 500", (err, rows) => {
      if (err) {
        console.error('Admin logs SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(rows, null, 2));
    });
  } catch (err) {
    console.error('Admin logs handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Admin: notify (email injection vulnerable) ----------
app.post('/api/admin/notify', (req, res) => {
  const { to, subject, body } = req.body || {};
  // simulate vulnerable mail: directly include 'to' in command (email injection)
  const cmd = `echo "${body}" | mail -s "${subject}" ${to}`; // dangerous: don't run in real world
  exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
    logRequest('admin','notify','/api/admin/notify', req.ip, JSON.stringify(req.body));
    if (err) return res.json({ status: 'error', err: stderr || err.message });
    res.json({ status: 'sent' });
  });
});

// ---------- Admin: list users (exposes plaintext passwords) ----------
app.get('/api/admin/users', (req, res) => {
  try {
    db.all("SELECT username,password,role FROM users", (err, rows) => {
      if (err) {
        console.error('Admin users SQL Error:', err.message);
        return res.status(500).json({ error: 'db', message: err.message });
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Admin users handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- File endpoint (path traversal) ----------
app.get('/api/file', (req, res) => {
  const p = req.query.path || '';
  // intentionally allow traversal
  const target = path.resolve(__dirname, p);
  res.sendFile(target, (err) => {
    if (err) return res.status(404).send('Not found');
  });
});

// ---------- Feedback (stored XSS, SQLi vulnerable) ----------
app.post('/api/feedback', (req, res) => {
  try {
    const { student_id, comment, category } = req.body || {};
    // Vulnerable to SQL injection - intentionally unparameterized
    const categoryStr = category ? `'${category}'` : 'NULL';
    db.run(`INSERT INTO comments(student_id,comment,created_at) VALUES('${student_id}','${comment}','${new Date().toISOString()}')`, function(err) {
      if (err) {
        console.error('Feedback SQL Error:', err.message);
        logRequest(student_id || 'anon','feedback_error','/api/feedback', req.ip, err.message);
        return res.json({ error: 'Failed to submit feedback', details: err.message });
      }
      logRequest(student_id || 'anon','feedback','/api/feedback', req.ip, comment);
      res.json({ status: 'ok', id: this.lastID });
    });
  } catch (err) {
    console.error('Feedback handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/feedback', (req, res) => {
  try {
    db.all("SELECT * FROM comments ORDER BY id DESC LIMIT 200", (err, rows) => {
      if (err) {
        console.error('Feedback list SQL Error:', err.message);
        return res.status(500).send('err');
      }
      res.send(rows.map(r => `<p>${r.comment}</p>`).join(''));
    });
  } catch (err) {
    console.error('Feedback list handler error:', err);
    return res.status(500).send('Server error');
  }
});

// ---------- Export endpoint (SSRF-like) ----------
app.get('/api/export', (req, res) => {
  const format = req.query.format || 'pdf';
  const data = req.query.data || '';
  // intentionally call out to internal URL supplied by user (dangerous)
  const url = data; // user controlled
  exec(`curl -s ${url}`, { timeout: 5000 }, (err, stdout, stderr) => {
    if (err) return res.status(500).send('error fetching');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(stdout);
  });
});

// ---------- Forgot password (username enumeration) ----------
app.post('/api/forgot-password', (req, res) => {
  const { username } = req.body || {};
  db.get(`SELECT username FROM users WHERE username='${username}'`, (err, row) => {
    if (err) return res.status(500).json({ error: 'db' });
    // leaks whether username exists
    if (row) return res.json({ status: 'ok' });
    else return res.json({ status: 'not_found' });
  });
});

// ---------- Search reflected XSS endpoint (for PoC) ----------
app.get('/api/search', (req, res) => {
  try {
    // This is used by frontend's library search in the simple form
    const q = req.query.query || req.query.q || '';
    // SQL search for students by name -- intentionally unsafe
    db.all(`SELECT id,name,dept FROM students WHERE name LIKE '%${q}%'`, (err, rows) => {
      if (err) {
        console.error('Search XSS SQL Error:', err.message);
        return res.status(500).send('err');
      }
      // return HTML unsanitized -> reflected XSS possible if 'q' contains HTML
      const html = rows.map(r => `<div><b>${r.id}</b> - ${r.name} (${r.dept})</div>`).join('');
      res.send(html + (rows.length === 0 ? `<div>No results for "${q}"</div>` : ''));
    });
  } catch (err) {
    console.error('Search XSS handler error:', err);
    return res.status(500).send('Server error');
  }
});

// ---------- Serve uploads listing (simple listing, directory accessible) ----------
app.get('/api/uploads/list', (req, res) => {
  fs.readdir(config.uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'fs' });
    res.json(files);
  });
});

// ---------- API Info Endpoint (helpful for debugging) ----------
app.get('/api', (req, res) => {
  res.json({
    message: 'Student Information System API',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/login',
      register: 'POST /api/register',
      students: 'GET /api/students',
      studentProfile: 'GET /api/student/profile/:id',
      studentMarks: 'GET /api/student/marks/:id',
      studentAttendance: 'GET /api/student/attendance/:id',
      studentFees: 'GET /api/student/fees/:id',
      libraryBooks: 'GET /api/library/books?student_id=ID'
    },
    status: 'running'
  });
});

// ---------- Catch-all for debugging (shows stack trace) ----------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  // Return JSON error instead of HTML to prevent crashes
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(config.serverPort, '0.0.0.0', () => {
  console.log(`Vulnerable SIC backend listening on http://0.0.0.0:${config.serverPort}`);
  console.log('Server configured to handle attacks without crashing (for testing purposes)');
  // log server start
  db.run(`INSERT INTO logs(user_id,action,endpoint,ip_address,timestamp,request_data) VALUES('system','start','/','0.0.0.0','${new Date().toISOString()}','server started')`, (err) => {
    if (err) console.error('Error logging server start:', err.message);
  });
});
