const {
  EXPIRY_DURATION
} = require("../config/constants");

function calculateExpiryTime() {
  return Date.now() + EXPIRY_DURATION;
}

function getUploadTime() {
  return new Date().toISOString();
}

module.exports = {
  calculateExpiryTime,
  getUploadTime
};