"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditModel = void 0;
const mongoose_1 = require("mongoose");
const auditSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    event: {
        type: String,
        enum: [
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'LOCKOUT_TRIGGERED',
            'REGISTER_SUCCESS',
            'PASSWORD_RESET_REQUESTED',
            'PASSWORD_RESET_SUCCESS',
            'TOKEN_REFRESHED',
            'LOGOUT',
        ],
        required: true,
    },
    status: { type: String, enum: ['success', 'failure'], required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
});
exports.AuditModel = (0, mongoose_1.model)('Audit', auditSchema);
exports.default = exports.AuditModel;
