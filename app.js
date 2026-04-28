const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const EXPIRY_DURATION = 24 * 60 * 60 * 1000;

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.url}`);
  next();
});


// ================= DATABASE =================

const db = new sqlite3.Database(
  path.join(__dirname, "database.db")
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


// ================= MULTER =================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

function fileFilter(req, file, cb) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/zip",
    "video/mp4"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});


// ================= ROUTES =================


// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/home.html"));
});


// Upload page
app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/test-upload.html"));
});


// Upload file
app.post("/upload", upload.single("file"), (req, res) => {

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  if (req.file.originalname.includes("..")) {
    return res.status(400).send("Invalid file name");
  }

  const code = uuidv4().slice(0, 6).toUpperCase();
  const uploadTime = new Date().toISOString();
  const expiryTime = Date.now() + EXPIRY_DURATION;

  db.run(
    `INSERT INTO files (code, original_name, stored_name, upload_time, expiry_time)
     VALUES (?, ?, ?, ?, ?)`,
    [code, req.file.originalname, req.file.filename, uploadTime, expiryTime],
    () => {
      res.redirect(`/result/${code}`);
    }
  );
});


// Upload success page
app.get("/result/:code", (req, res) => {

  const code = req.params.code;

  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Upload Successful</title>
<link rel="stylesheet" href="/style.css">
</head>

<body>

<div class="container"> 

<h2>Upload Successful</h2>

<p>Your access code:</p>

<input id="code" value="${code}" readonly>

<button onclick="copy()">Copy Code</button>

<a href="/access">
<button>Go to Access Page</button>
</a>

</div>

<script>
function copy() {
  const input = document.getElementById("code");
  input.select();
  document.execCommand("copy");
  alert("Code copied!");
}
</script>

</body>
</html>
`);
});


// Access page (important route)
app.get("/access", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public/pages/access.html")
  );
});


// Access form submission
app.post("/access", (req, res) => {

  if (!req.body.code) {
    return res.redirect("/access");
  }

  const code = req.body.code.trim().toUpperCase();

  res.redirect(`/file/${code}`);
});


// Support old open?code= style
app.get("/open", (req, res) => {
  const code = req.query.code;
  res.redirect(`/file/${code}`);
});


// File preview page
app.get("/file/:code", (req, res) => {

  const code = req.params.code;

  db.get(
    "SELECT * FROM files WHERE code = ?",
    [code],
    (err, row) => {

      if (!row) {
        return res.status(404).sendFile(
          path.join(__dirname, "public/pages/errors/invalid.html")
        );
      }

      if (Date.now() > row.expiry_time) {
        return res.status(410).sendFile(
          path.join(__dirname, "public/pages/errors/expired.html")
        );
      }

      const remaining = Math.max(0, row.expiry_time - Date.now());

      res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Download File</title>
<link rel="stylesheet" href="/style.css">
</head>

<body>

<div class="container">

<h2>File Ready</h2>

<p><strong>${row.original_name}</strong></p>

<p>Expires in: <span id="timer"></span></p>

<a href="/download/${code}">
<button>Download</button>
</a>

</div>

<a href="/">
<button>Back to Home</button>
</a>

<script>

let time = ${remaining};
const el = document.getElementById("timer");

setInterval(() => {

if (time <= 0) {
  el.innerText = "Expired";
  return;
}

const min = Math.floor(time / 60000);
const sec = Math.floor((time % 60000) / 1000);

el.innerText = min + "m " + sec + "s";

time -= 1000;

}, 1000);

</script>

</body>
</html>
`);
    }
  );
});


// Download route
app.get("/download/:code", (req, res) => {

  const code = req.params.code;

  db.get(
    "SELECT * FROM files WHERE code = ?",
    [code],
    (err, row) => {

      if (!row || Date.now() > row.expiry_time) {
        return res.redirect("/access");
      }

      const filePath = path.join(__dirname, "uploads", row.stored_name);

      res.download(filePath, row.original_name);

    }
  );
});


// About page
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/about.html"));
});


// ================= CLEANUP JOB =================

setInterval(() => {

  const now = Date.now();

  db.all(
    "SELECT * FROM files WHERE expiry_time < ?",
    [now],
    (err, rows) => {

      if (rows && rows.length > 0) {

        rows.forEach(file => {

          const filePath = path.join(__dirname, "uploads", file.stored_name);

          fs.unlink(filePath, () => {});

          db.run(
            "DELETE FROM files WHERE id = ?",
            [file.id]
          );

        });

      }

    }
  );

}, 60000);


// ================= ERROR HANDLING =================

app.use((err, req, res, next) => {

  if (err instanceof multer.MulterError) {
    return res.status(400).send(err.message);
  }

  if (err) {
    return res.status(400).send(err.message);
  }

  next();

});


// 404 (must be last)
app.use((req, res) => {

  res.status(404).sendFile(
    path.join(__dirname, "public/pages/errors/404.html")
  );

});


// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
