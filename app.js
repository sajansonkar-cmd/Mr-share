const express = require("express");
const upload = require("./config/multerConfig");
const path = require("path");
const fs = require("fs");
const initializeUploads = require("./startup/initializeUploads");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const logger = require("./utils/logger");
const uploadRoutes = require("./routes/uploadRoutes");

const pageController =
require("./controllers/pageController");
const uploadController =
require("./controllers/uploadController");
const fileService = require("./services/fileService");
const shareService = require("./services/shareService");
const databaseService = require("./services/databaseService");
const {
  MAX_FILE_SIZE
} = require("./config/constants");

const app = express();
initializeUploads();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(uploadRoutes);

const EXPIRY_DURATION = 24 * 60 * 60 * 1000;


// ================= Request logger =================

app.use(requestLogger);


// ================= ROUTES =================


// Home
//app.get("/", (req, res) => {
  //res.sendFile(path.join(__dirname, "public/pages/home.html"));
//});


// Upload page
app.get(
  "/upload",
  pageController.showUploadPage
);



// Upload success page
app.get(
  "/result/:code",
  pageController.showResultPage
);


// Access page (important route)
app.get(
  "/access",
  pageController.showAccessPage
);


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
app.get("/file/:code", async (req, res) => {

  const code = req.params.code;

  try {

    const row =
      await databaseService.getFileByCode(code);

    if (!row) {
      return res.status(404).sendFile(
        path.join(
          __dirname,
          "public/pages/errors/invalid.html"
        )
      );
    }

    if (Date.now() > row.expiry_time) {
      return res.status(410).sendFile(
        path.join(
          __dirname,
          "public/pages/errors/expired.html"
        )
      );
    }

    const remaining = Math.max(
      0,
      row.expiry_time - Date.now()
    );

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

  } catch (err) {

    logger.error(err.stack || err.message || err);

    res
      .status(500)
      .send("Database Error");

  }

});


// Download route
app.get("/download/:code", async (req, res) => {

  const code = req.params.code;

  try {

    const row =
      await databaseService.getFileByCode(code);

    if (
      !row ||
      Date.now() > row.expiry_time
    ) {
      return res.redirect("/access");
    }

    const filePath = path.join(
      __dirname,
      "uploads",
      row.stored_name
    );

    res.download(
      filePath,
      row.original_name
    );

  } catch (err) {

    logger.error(err.stack || err.message || err);

    res
      .status(500)
      .send("Database Error");

  }

});

// About page
app.get(
  "/about",
  pageController.showAboutPage
);


// ================= CLEANUP JOB =================

setInterval(async () => {

  const now = Date.now();

  try {

    const rows =
      await databaseService.getExpiredFiles(now);

    for (const file of rows) {

      const filePath = path.join(
        __dirname,
        "uploads",
        file.stored_name
      );

      fs.unlink(filePath, () => {});

      await databaseService.deleteFileRecord(
        file.id
      );

    }

  } catch (err) {

    logger.error(
      `Cleanup job failed: ${err.stack || err.message || err}`
    );

  }

}, 60000);


// ================= ERROR HANDLING =================

app.use(errorHandler);


// 404 (must be last)
app.use((req, res) => {

  res.status(404).sendFile(
    path.join(__dirname, "public/pages/errors/404.html")
  );

});


// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
