/**
 * seed.js
 * Creates students.db with required tables and sample data.
 * Run: node seed.js
 */

const fs = require('fs');
const path = require('path');
const dbFile = path.resolve(__dirname, 'students.db');
if (fs.existsSync(dbFile)) {
  console.log("Removing previous DB:", dbFile);
  try { fs.unlinkSync(dbFile); } catch(e){ console.error(e); }
}

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = OFF;");
  db.run("BEGIN TRANSACTION;");

  // Drop tables if exist
  db.run("DROP TABLE IF EXISTS users;");
  db.run("DROP TABLE IF EXISTS students;");
  db.run("DROP TABLE IF EXISTS marks;");
  db.run("DROP TABLE IF EXISTS attendance;");
  db.run("DROP TABLE IF EXISTS subjects;");
  db.run("DROP TABLE IF EXISTS fees;");
  db.run("DROP TABLE IF EXISTS library;");
  db.run("DROP TABLE IF EXISTS announcements;");
  db.run("DROP TABLE IF EXISTS logs;");
  db.run("DROP TABLE IF EXISTS uploads;");
  db.run("DROP TABLE IF EXISTS comments;");

  // Create tables
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    student_id TEXT
  );`);

  db.run(`CREATE TABLE students (
    id TEXT PRIMARY KEY,
    name TEXT,
    age INTEGER,
    dept TEXT,
    semester INTEGER,
    batch INTEGER,
    phone TEXT,
    email TEXT,
    city TEXT,
    cgpa REAL
  );`);

  db.run(`CREATE TABLE subjects (
    subject_id TEXT PRIMARY KEY,
    subject_name TEXT,
    subject_code TEXT,
    credits INTEGER,
    department TEXT,
    semester INTEGER
  );`);

  db.run(`CREATE TABLE marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    subject_id TEXT,
    exam_type TEXT,
    marks INTEGER,
    max_marks INTEGER,
    grade TEXT
  );`);

  db.run(`CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    subject_id TEXT,
    date TEXT,
    status TEXT,
    marked_by TEXT
  );`);

  db.run(`CREATE TABLE fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    semester INTEGER,
    amount INTEGER,
    paid_amount INTEGER,
    due_date TEXT,
    status TEXT,
    payment_date TEXT
  );`);

  db.run(`CREATE TABLE library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    book_id TEXT,
    title TEXT,
    issue_date TEXT,
    due_date TEXT,
    return_date TEXT,
    fine INTEGER
  );`);

  db.run(`CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    posted_by TEXT,
    date TEXT,
    audience TEXT
  );`);

  db.run(`CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT,
    endpoint TEXT,
    ip_address TEXT,
    timestamp TEXT,
    request_data TEXT
  );`);

  db.run(`CREATE TABLE uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    uploader TEXT,
    uploaded_at TEXT
  );`);

  db.run(`CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    comment TEXT,
    created_at TEXT
  );`);

  // Seed admin user (plaintext intentionally)
  db.run(`INSERT INTO users(username,password,role,student_id) VALUES('admin','admin123','admin',NULL);`);

  // Seed student users and students table (STU001..STU030)
  const students = [
    {id:"STU001", name:"Rahul Sharma", city:"Mumbai", dept:"CSE", batch:2023, sem:4, age:20, password:"rahul123"},
    {id:"STU002", name:"Priya Patel", city:"Ahmedabad", dept:"ECE", batch:2023, sem:4, age:19, password:"priya123"},
    {id:"STU003", name:"Arjun Reddy", city:"Hyderabad", dept:"CSE", batch:2022, sem:6, age:21, password:"arjun123"},
    {id:"STU004", name:"Sneha Gupta", city:"Delhi", dept:"IT", batch:2024, sem:2, age:18, password:"sneha123"},
    {id:"STU005", name:"Vikram Singh", city:"Lucknow", dept:"ME", batch:2022, sem:6, age:21, password:"vikram123"},
    {id:"STU006", name:"Anjali Verma", city:"Kanpur", dept:"CSE", batch:2023, sem:3, age:19, password:"anjali123"},
    {id:"STU007", name:"Rohit Kumar", city:"Bengaluru", dept:"ECE", batch:2022, sem:5, age:21, password:"rohit123"},
    {id:"STU008", name:"Harika Reddy", city:"Hyderabad", dept:"CSE", batch:2023, sem:4, age:20, password:"harika123"},
    {id:"STU009", name:"Meena Kumari", city:"Jaipur", dept:"CE", batch:2023, sem:4, age:20, password:"meena123"},
    {id:"STU010", name:"Soni Kumar", city:"Vijayawada", dept:"CSE", batch:2024, sem:2, age:18, password:"soni123"},
    {id:"STU011", name:"Pranav Desai", city:"Surat", dept:"IT", batch:2023, sem:4, age:19, password:"pranav123"},
    {id:"STU012", name:"Manish Yadav", city:"Kanpur", dept:"ME", batch:2022, sem:6, age:21, password:"manish123"},
    {id:"STU013", name:"Vishal Mehta", city:"Mumbai", dept:"CSE", batch:2023, sem:4, age:20, password:"vishal123"},
    {id:"STU014", name:"Deepak Sharma", city:"Jaipur", dept:"ECE", batch:2022, sem:6, age:21, password:"deepak123"},
    {id:"STU015", name:"Varun Nair", city:"Kochi", dept:"CSE", batch:2024, sem:2, age:18, password:"varun123"},
    {id:"STU016", name:"Satya Narayan", city:"Bhubaneswar", dept:"CSE", batch:2023, sem:4, age:20, password:"satya123"},
    {id:"STU017", name:"Suresh Babu", city:"Tirupati", dept:"ME", batch:2022, sem:6, age:21, password:"suresh123"},
    {id:"STU018", name:"Mahesh Rao", city:"Bengaluru", dept:"CSE", batch:2023, sem:4, age:20, password:"mahesh123"},
    {id:"STU019", name:"Bhavana Iyer", city:"Chennai", dept:"ECE", batch:2024, sem:2, age:18, password:"bhavana123"},
    {id:"STU020", name:"Mounika Das", city:"Hyderabad", dept:"IT", batch:2023, sem:4, age:20, password:"mounika123"},
    {id:"STU021", name:"Swapna R", city:"Vijayawada", dept:"CSE", batch:2023, sem:4, age:20, password:"swapna123"},
    {id:"STU022", name:"Chaitra K", city:"Mysuru", dept:"CSE", batch:2023, sem:4, age:20, password:"chaitra123"},
    {id:"STU023", name:"Divya Sharma", city:"New Delhi", dept:"CE", batch:2022, sem:6, age:21, password:"divya123"},
    {id:"STU024", name:"Sneha Patel", city:"Ahmedabad", dept:"CSE", batch:2024, sem:2, age:18, password:"snehap123"},
    {id:"STU025", name:"Teja Kumar", city:"Visakhapatnam", dept:"CSE", batch:2023, sem:4, age:20, password:"teja123"},
    {id:"STU026", name:"Ramesh Gupta", city:"Patna", dept:"ME", batch:2022, sem:6, age:21, password:"ramesh123"},
    {id:"STU027", name:"Nikita R", city:"Pune", dept:"CSE", batch:2023, sem:4, age:20, password:"nikita123"},
    {id:"STU028", name:"Kavya S", city:"Mysuru", dept:"ECE", batch:2023, sem:4, age:20, password:"kavya123"},
    {id:"STU029", name:"Asha Verma", city:"Kanpur", dept:"IT", batch:2024, sem:2, age:18, password:"asha123"},
    {id:"STU030", name:"Rohini P", city:"Coimbatore", dept:"CSE", batch:2023, sem:4, age:20, password:"rohini123"}
  ];

  const userStmt = db.prepare("INSERT INTO users(username,password,role,student_id) VALUES(?,?,?,?);");
  const stStmt = db.prepare("INSERT INTO students(id,name,age,dept,semester,batch,phone,email,city,cgpa) VALUES(?,?,?,?,?,?,?,?,?,?)");

  students.forEach((s, i) => {
    // Use student ID as username (e.g., STU001, STU002, etc.)
    const username = s.id;
    // Each student has unique password
    userStmt.run(username, s.password, "student", s.id);
    stStmt.run(s.id, s.name, s.age, s.dept, s.sem, s.batch,
      "+91" + (9000000000 + i).toString().slice(-10),
      s.name.toLowerCase().replace(/\s+/g,'.') + "@example.edu",
      s.city, (7.0 + (i%20)/10).toFixed(2));
  });

  userStmt.finalize();
  stStmt.finalize();

  // Seed subjects
  const subjects = [
    {id:"SUB101", name:"Data Structures", code:"DS101", credits:4, dept:"CSE", sem:4},
    {id:"SUB102", name:"Database Systems", code:"DB101", credits:4, dept:"CSE", sem:4},
    {id:"SUB103", name:"Operating Systems", code:"OS101", credits:4, dept:"CSE", sem:4},
    {id:"SUB104", name:"Web Technologies", code:"WT101", credits:3, dept:"CSE", sem:4},
    {id:"SUB105", name:"Mathematics", code:"MA101", credits:3, dept:"CSE", sem:4}
  ];
  const subjStmt = db.prepare("INSERT INTO subjects(subject_id,subject_name,subject_code,credits,department,semester) VALUES(?,?,?,?,?,?)");
  subjects.forEach(s => subjStmt.run(s.id,s.name,s.code,s.credits,s.department,s.semester));
  subjStmt.finalize();

  // Seed marks (random-ish)
  const markStmt = db.prepare("INSERT INTO marks(student_id,subject_id,exam_type,marks,max_marks,grade) VALUES(?,?,?,?,?,?)");
  students.forEach((s, i) => {
    subjects.forEach((sub, j) => {
      const m = 40 + ((i + j*7) % 56); // 40..95
      const grade = m >= 85 ? "A" : m >= 70 ? "B" : m >= 55 ? "C" : "D";
      markStmt.run(s.id, sub.id, "End-Term", m, 100, grade);
    });
  });
  markStmt.finalize();

  // Seed attendance (few rows per student)
  const attStmt = db.prepare("INSERT INTO attendance(student_id,subject_id,date,status,marked_by) VALUES(?,?,?,?,?)");
  const today = new Date();
  for (let d = 1; d <= 30; d+=7) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate()-d).toISOString().slice(0,10);
    students.forEach(s => {
      const sub = subjects[(Math.random()*subjects.length)|0];
      const status = Math.random() > 0.1 ? "P" : "A";
      attStmt.run(s.id, sub.id, dt, status, "faculty1");
    });
  }
  attStmt.finalize();

  // Seed fees
  const feesStmt = db.prepare("INSERT INTO fees(student_id,semester,amount,paid_amount,due_date,status,payment_date) VALUES(?,?,?,?,?,?,?)");
  students.forEach((s,i) => {
    const total = 45000;
    const paid = (i % 3 === 0) ? 45000 : (i % 3 === 1) ? 30000 : 33000;
    const status = paid >= total ? "Paid" : (paid > 0 ? "Partial" : "Pending");
    const paidDate = paid > 0 ? new Date().toISOString().slice(0,10) : null;
    feesStmt.run(s.id, 4, total, paid, "2025-12-15", status, paidDate);
  });
  feesStmt.finalize();

  // Seed library
  const libStmt = db.prepare("INSERT INTO library(student_id,book_id,title,issue_date,due_date,return_date,fine) VALUES(?,?,?,?,?,?,?)");
  libStmt.run("STU001","B1001","Database Systems","2025-10-01","2025-10-30",null,50);
  libStmt.run("STU001","B1004","Web Technologies","2025-10-15","2025-11-15",null,0);
  libStmt.run("STU002","B1002","Design Patterns","2025-09-20","2025-10-20","2025-10-19",0);
  libStmt.finalize();

  // Initial announcements
  db.run(`INSERT INTO announcements(title,content,posted_by,date,audience) VALUES(
    'Welcome to Lab','This is the vulnerable pentesting lab interface. Use responsibly.','admin','${new Date().toISOString()}','all')`);

  // Logs & uploads & comments
  db.run(`INSERT INTO logs(user_id,action,endpoint,ip_address,timestamp,request_data) VALUES('system','seed','/seed','127.0.0.1','${new Date().toISOString()}','seeded db')`);
  db.run(`INSERT INTO uploads(filename,uploader,uploaded_at) VALUES('welcome.pdf','admin','${new Date().toISOString()}')`);
  db.run(`INSERT INTO comments(student_id,comment,created_at) VALUES('STU001','Welcome to the lab!','${new Date().toISOString()}')`);

  db.run("COMMIT;", (err) => {
    if (err) console.error("Commit error:", err);
    else console.log("Database created and seeded at", dbFile);
    db.close();
  });
});
