const path = require("path");

module.exports = {
  UPLOAD_DIR: path.join(
    __dirname,
    "..",
    "uploads"
  )
};


/*
Use:

"const { UPLOAD_DIR } =
  require("./config/paths");"

instead of:

"uploads"

or

"path.join(__dirname,"uploads")"

everywhere.

 */