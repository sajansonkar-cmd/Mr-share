const { v4: uuidv4 } = require("uuid");

function generateShareCode() {
  return uuidv4()
    .slice(0, 6)
    .toUpperCase();
}

module.exports = {
  generateShareCode
};