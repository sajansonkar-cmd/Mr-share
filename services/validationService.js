const { fileTypeFromFile } = require("file-type");
const allowedFileTypes = require("../config/allowedFileTypes");

async function validateUploadedFile(filePath) {
  try {
    const detectedType = await fileTypeFromFile(filePath);

    if (!detectedType) {
      return false;
    }

    return allowedFileTypes.includes(detectedType.mime);

  } catch (error) {
    console.error("Validation Error:", error.message);
    return false;
  }
}

module.exports = {
  validateUploadedFile
};