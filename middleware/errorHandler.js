const multer = require("multer");

function errorHandler(err, req, res, next) {

    if (err instanceof multer.MulterError) {
        return res.status(400).send(err.message);
    }

    if (err) {
        return res.status(400).send(err.message);
    }

    next();
}

module.exports = errorHandler;