const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "..", "database.db")
);

db.run(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    original_name TEXT,
    stored_name TEXT,
    upload_time TEXT,
    expiry_time INTEGER
  )
`);

function createFileRecord(
  code,
  originalName,
  storedName,
  uploadTime,
  expiryTime
) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO files
      (code, original_name, stored_name, upload_time, expiry_time)
      VALUES (?, ?, ?, ?, ?)`,
      [
        code,
        originalName,
        storedName,
        uploadTime,
        expiryTime
      ],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

function getFileByCode(code) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM files WHERE code = ?",
      [code],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

function getExpiredFiles(currentTime) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM files WHERE expiry_time < ?",
      [currentTime],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function deleteFileRecord(id) {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM files WHERE id = ?",
      [id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

module.exports = {
  createFileRecord,
  getFileByCode,
  getExpiredFiles,
  deleteFileRecord
};