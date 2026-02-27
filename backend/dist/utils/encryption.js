"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptSessionNote = exports.encryptSessionNote = void 0;
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const error_middleware_1 = require("../middleware/error.middleware");
const ALGORITHM = 'aes-256-gcm';
const getSessionNotesKey = () => {
    const rawKey = env_1.env.sessionNotesEncryptionKey;
    if (!rawKey || rawKey.trim().length < 16) {
        throw new error_middleware_1.AppError('SESSION_NOTES_ENCRYPTION_KEY is not configured', 500);
    }
    return (0, crypto_1.createHash)('sha256').update(rawKey).digest();
};
const encryptSessionNote = (plainText) => {
    const ivBuffer = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, getSessionNotesKey(), ivBuffer);
    const encryptedBuffer = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTagBuffer = cipher.getAuthTag();
    return {
        encryptedContent: encryptedBuffer.toString('base64'),
        iv: ivBuffer.toString('base64'),
        authTag: authTagBuffer.toString('base64'),
    };
};
exports.encryptSessionNote = encryptSessionNote;
const decryptSessionNote = (payload) => {
    const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, getSessionNotesKey(), Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const decryptedBuffer = Buffer.concat([
        decipher.update(Buffer.from(payload.encryptedContent, 'base64')),
        decipher.final(),
    ]);
    return decryptedBuffer.toString('utf8');
};
exports.decryptSessionNote = decryptSessionNote;
