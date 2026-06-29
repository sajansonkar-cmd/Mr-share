const path = require("path");
const logger = require("../utils/logger");

function showUploadPage(req, res) {
  logger.info("Upload page opened");

  res.sendFile(
    path.join(__dirname, "..", "public/pages/test-upload.html")
  );
}

function showAccessPage(req, res) {
  logger.info("Access page opened");

  res.sendFile(
    path.join(__dirname, "..", "public/pages/access.html")
  );
}

function showAboutPage(req, res) {
  logger.info("About page opened");

  res.sendFile(
    path.join(__dirname, "..", "public/pages/about.html")
  );
}

function showResultPage(req, res) {
  const code = req.params.code;

  logger.info(`Showing upload result page for code: ${code}`);

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

<input
  id="code"
  value="${code}"
  readonly
>

<button onclick="copy()">
Copy Code
</button>

<a href="/access">
<button>
Go to Access Page
</button>
</a>

</div>

<script>

function copy(){

const input =
document.getElementById("code");

input.select();

document.execCommand("copy");

alert("Code copied!");

}

</script>

</body>
</html>
`);
}

module.exports = {
  showUploadPage,
  showAccessPage,
  showAboutPage,
  showResultPage
};