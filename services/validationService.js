const { fileTypeFromFile } = require("file-type");

const allowedTypes =
  require("../config/allowedFileTypes");

async function validateUploadedFile(filePath) {

  const detectedType =
    await fileTypeFromFile(filePath);

  if (!detectedType) {
    return false;
  }

  return allowedTypes.includes(
    detectedType.mime
  );

}

module.exports = {
  validateUploadedFile
};