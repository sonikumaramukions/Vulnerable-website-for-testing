const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

const db = new sqlite3.Database(config.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error("Failed to open DB:", err);
  } else {
    console.log("Connected to SQLite DB at", config.dbPath);
  }
});

module.exports = db;
