const multer = require("multer");
const path = require("path");

const allowedFileTypes = require("./allowedFileTypes");
const { MAX_FILE_SIZE } = require("./constants");
const { UPLOAD_DIR } = require("./paths");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

function fileFilter(req, file, cb) {

  if (allowedFileTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("File type not allowed"), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

module.exports = upload;