const express = require("express");

const upload = require("../config/multerConfig");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/upload",
  upload.single("file"),
  uploadController.uploadFile
);

module.exports = router;