function formatTime() {
  return new Date().toISOString();
}

function info(message) {
  console.log(
    `[INFO] ${formatTime()} - ${message}`
  );
}

function warn(message) {
  console.warn(
    `[WARN] ${formatTime()} - ${message}`
  );
}

function error(message) {
  console.error(
    `[ERROR] ${formatTime()} - ${message}`
  );
}

module.exports = {
  info,
  warn,
  error
};