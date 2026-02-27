"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModel = void 0;
const mongoose_1 = require("mongoose");
const sessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    refreshTokenHash: { type: String, required: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    device: { type: String, default: null },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
    lastActiveAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    versionKey: false,
});
sessionSchema.index({ userId: 1, revokedAt: 1 });
exports.SessionModel = (0, mongoose_1.model)('Session', sessionSchema);
exports.default = exports.SessionModel;
