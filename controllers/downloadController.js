const path = require("path");

const databaseService = require("../services/databaseService");
const logger = require("../utils/logger");

async function showFile(req, res) {
  try {
    const code = req.params.code;

    const row = await databaseService.getFileByCode(code);

    if (!row) {
      logger.warn(`Invalid access code: ${code}`);

      return res.status(404).sendFile(
        path.join(
          __dirname,
          "..",
          "public/pages/errors/invalid.html"
        )
      );
    }

    if (Date.now() > row.expiry_time) {
      logger.warn(`Expired file accessed: ${code}`);

      return res.status(410).sendFile(
        path.join(
          __dirname,
          "..",
          "public/pages/errors/expired.html"
        )
      );
    }

    const remaining = Math.max(
      0,
      row.expiry_time - Date.now()
    );

    logger.info(`Viewing file: ${row.original_name}`);

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

<p>Expires in:
<span id="timer"></span></p>

<a href="/download/${code}">
<button>Download</button>
</a>

</div>

<a href="/">
<button>Back to Home</button>
</a>

<script>

let time=${remaining};

const el=document.getElementById("timer");

setInterval(()=>{

if(time<=0){
el.innerText="Expired";
return;
}

const min=Math.floor(time/60000);
const sec=Math.floor((time%60000)/1000);

el.innerText=min+"m "+sec+"s";

time-=1000;

},1000);

</script>

</body>
</html>
`);

  } catch (error) {

    logger.error("Failed to display file page.", error);

    res.status(500).send("Internal Server Error");
  }
}

async function downloadFile(req, res) {
  try {
    const code = req.params.code;

    const row = await databaseService.getFileByCode(code);

    if (!row) {
      logger.warn(`Download requested for invalid code: ${code}`);
      return res.redirect("/access");
    }

    if (Date.now() > row.expiry_time) {
      logger.warn(`Download requested for expired code: ${code}`);
      return res.redirect("/access");
    }

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      row.stored_name
    );

    logger.info(`Downloading file: ${row.original_name}`);

    res.download(filePath, row.original_name);

  } catch (error) {

    logger.error("Download failed.", error);

    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  showFile,
  downloadFile
};