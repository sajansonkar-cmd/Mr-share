const EXPIRY_DURATION = 24 * 60 * 60 * 1000;

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