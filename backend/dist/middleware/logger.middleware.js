"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationInMs = Number(end - start) / 1_000_000;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationInMs.toFixed(2)}ms`;
        if (res.statusCode >= 500) {
            console.error(message);
            return;
        }
        console.log(message);
    });
    next();
};
exports.requestLogger = requestLogger;
