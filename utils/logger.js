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

function error(message, err = null) {
  console.error(
    `[ERROR] ${formatTime()} - ${message}`
  );

  if (err) {
    console.error(err);
  }
}

module.exports = {
  info,
  warn,
  error
};