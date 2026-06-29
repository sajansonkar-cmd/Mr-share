const logger = require("../utils/logger");
function requestLogger(req, res, next) {

  const startTime = Date.now();

  res.on("finish", () => {

    const duration = Date.now() - startTime;

  logger.info(
  `${req.ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
);

  });

  next();
}

module.exports = requestLogger;