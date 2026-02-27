"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const refreshTokenSchema = new mongoose_1.Schema({
    jti: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Session', default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    name: { type: String, trim: true, default: null },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    profileImageKey: { type: String, default: null },
    profileImageUrl: { type: String, default: null },
    passwordHash: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    provider: {
        type: String,
        enum: ['local', 'google', 'phone'],
        default: 'local',
    },
    role: {
        type: String,
        enum: ['patient', 'therapist', 'admin'],
        default: 'patient',
        index: true,
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    emailVerificationOtpHash: { type: String, default: null },
    emailVerificationOtpExpiresAt: { type: Date, default: null },
    phoneVerificationOtpHash: { type: String, default: null },
    phoneVerificationOtpExpiresAt: { type: Date, default: null },
    passwordResetOtpHash: { type: String, default: null },
    passwordResetOtpExpiresAt: { type: Date, default: null },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
}, {
    timestamps: true,
    versionKey: false,
});
const shouldApplyNotDeletedFilter = (filter) => {
    return !Object.prototype.hasOwnProperty.call(filter, 'isDeleted');
};
const applyNotDeletedFilter = function () {
    const options = this.getOptions();
    if (options.withDeleted === true) {
        return;
    }
    const filter = this.getFilter();
    if (!shouldApplyNotDeletedFilter(filter)) {
        return;
    }
    this.setQuery({
        ...filter,
        isDeleted: false,
    });
};
userSchema.pre('find', applyNotDeletedFilter);
userSchema.pre('findOne', applyNotDeletedFilter);
userSchema.pre('findOneAndUpdate', applyNotDeletedFilter);
userSchema.pre('countDocuments', applyNotDeletedFilter);
userSchema.pre('updateOne', applyNotDeletedFilter);
userSchema.pre('updateMany', applyNotDeletedFilter);
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'refreshTokens.jti': 1 });
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
exports.default = exports.UserModel;
