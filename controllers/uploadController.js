const path = require("path");
const fs = require("fs");

const fileService = require("../services/fileService");
const shareService = require("../services/shareService");
const validationService = require("../services/validationService");
const databaseService = require("../services/databaseService");

async function uploadFile(req, res) {
  try {

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    if (req.file.originalname.includes("..")) {
      return res.status(400).send("Invalid file name");
    }

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      req.file.filename
    );

    const isValid =
      await validationService.validateUploadedFile(filePath);

    if (!isValid) {

      fs.unlink(filePath, () => {});

      return res
        .status(400)
        .send("Invalid file content");

    }

    const code =
      shareService.generateShareCode();

    const uploadTime =
      fileService.getUploadTime();

    const expiryTime =
      fileService.calculateExpiryTime();

    await databaseService.createFileRecord(
      code,
      req.file.originalname,
      req.file.filename,
      uploadTime,
      expiryTime
    );

    res.redirect(`/result/${code}`);

  } catch (error) {

    logger.error(error);

    res
      .status(500)
      .send("Internal Server Error");

  }
}

module.exports = {
  uploadFile
};