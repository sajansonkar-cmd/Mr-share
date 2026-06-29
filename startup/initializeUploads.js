const fs = require("fs");
const { UPLOAD_DIR } = require("../config/paths");

function initializeUploads() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, {
      recursive: true
    });

    console.log("Uploads folder created.");
  }
}

module.exports = initializeUploads;