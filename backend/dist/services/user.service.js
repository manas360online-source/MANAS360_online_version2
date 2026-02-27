"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreDeletedUserAccount = exports.invalidateMySession = exports.listMyActiveSessions = exports.changeMyPassword = exports.uploadMyProfilePhoto = exports.softDeleteMyAccount = exports.updateMyProfile = exports.getMyProfile = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const error_middleware_1 = require("../middleware/error.middleware");
const s3_service_1 = require("./s3.service");
const hash_1 = require("../utils/hash");
const session_model_1 = __importDefault(require("../models/session.model"));
const mongoose_1 = require("mongoose");
const safeUserProjection = {
    passwordHash: 0,
    emailVerificationOtpHash: 0,
    emailVerificationOtpExpiresAt: 0,
    phoneVerificationOtpHash: 0,
    phoneVerificationOtpExpiresAt: 0,
    passwordResetOtpHash: 0,
    passwordResetOtpExpiresAt: 0,
    mfaSecret: 0,
    refreshTokens: 0,
};
const assertUserIsActive = async (userId) => {
    const user = await user_model_1.default.findById(userId).select('_id isDeleted').lean();
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    if (user.isDeleted) {
        throw new error_middleware_1.AppError('User account is deleted', 410);
    }
};
const getMyProfile = async (userId) => {
    await assertUserIsActive(userId);
    const user = await user_model_1.default.findOne({ _id: userId, isDeleted: false }, safeUserProjection).lean();
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    return user;
};
exports.getMyProfile = getMyProfile;
const updateMyProfile = async (userId, payload) => {
    await assertUserIsActive(userId);
    const updatePayload = {};
    if (payload.name !== undefined) {
        updatePayload.name = payload.name;
    }
    if (payload.phone !== undefined) {
        const existingPhoneOwner = await user_model_1.default.findOne({
            phone: payload.phone,
            isDeleted: false,
            _id: { $ne: userId },
        })
            .select('_id')
            .lean();
        if (existingPhoneOwner) {
            throw new error_middleware_1.AppError('Phone is already in use', 409);
        }
        updatePayload.phone = payload.phone;
    }
    if (Object.keys(updatePayload).length === 0) {
        throw new error_middleware_1.AppError('No allowed fields provided for update', 400);
    }
    const updatedUser = await user_model_1.default.findOneAndUpdate({ _id: userId, isDeleted: false }, {
        $set: updatePayload,
        $currentDate: { updatedAt: true },
    }, { new: true, runValidators: true, projection: safeUserProjection, timestamps: true }).lean();
    if (!updatedUser) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    return updatedUser;
};
exports.updateMyProfile = updateMyProfile;
const softDeleteMyAccount = async (userId) => {
    const updated = await user_model_1.default.updateOne({ _id: userId, isDeleted: false }, {
        $set: {
            isDeleted: true,
            deletedAt: new Date(),
            refreshTokens: [],
        },
    });
    if (updated.matchedCount === 0) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
};
exports.softDeleteMyAccount = softDeleteMyAccount;
const uploadMyProfilePhoto = async (userId, file) => {
    await assertUserIsActive(userId);
    const existingUser = await user_model_1.default.findOne({ _id: userId, isDeleted: false })
        .select('_id profileImageKey')
        .lean();
    if (!existingUser) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    const uploaded = await (0, s3_service_1.uploadProfilePhotoToS3)({
        userId,
        buffer: file.buffer,
        mimeType: file.mimetype,
    });
    if (existingUser.profileImageKey) {
        await (0, s3_service_1.deleteFileFromS3)(existingUser.profileImageKey);
    }
    const updatedUser = await user_model_1.default.findOneAndUpdate({ _id: userId, isDeleted: false }, {
        $set: {
            profileImageKey: uploaded.objectKey,
            profileImageUrl: uploaded.objectUrl,
        },
        $currentDate: { updatedAt: true },
    }, { new: true, runValidators: true, projection: safeUserProjection, timestamps: true }).lean();
    if (!updatedUser) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    const signedProfileImageUrl = await (0, s3_service_1.getSignedProfilePhotoUrl)(uploaded.objectKey);
    return {
        ...updatedUser,
        signedProfileImageUrl,
    };
};
exports.uploadMyProfilePhoto = uploadMyProfilePhoto;
const changeMyPassword = async (userId, payload) => {
    await assertUserIsActive(userId);
    const user = await user_model_1.default.findOne({ _id: userId, isDeleted: false }).select('_id passwordHash');
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    if (!user.passwordHash) {
        throw new error_middleware_1.AppError('Password login is not enabled for this account', 400);
    }
    const currentPasswordMatches = await (0, hash_1.verifyPassword)(payload.currentPassword, user.passwordHash);
    if (!currentPasswordMatches) {
        throw new error_middleware_1.AppError('currentPassword is incorrect', 401);
    }
    const newMatchesCurrent = await (0, hash_1.verifyPassword)(payload.newPassword, user.passwordHash);
    if (newMatchesCurrent) {
        throw new error_middleware_1.AppError('newPassword must be different from currentPassword', 400);
    }
    const newPasswordHash = await (0, hash_1.hashPassword)(payload.newPassword);
    await user_model_1.default.updateOne({ _id: userId, isDeleted: false }, {
        $set: {
            passwordHash: newPasswordHash,
            passwordChangedAt: new Date(),
            refreshTokens: [],
        },
        $currentDate: { updatedAt: true },
    });
    await session_model_1.default.updateMany({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }, { $set: { revokedAt: new Date() } });
};
exports.changeMyPassword = changeMyPassword;
const listMyActiveSessions = async (userId, currentSessionId) => {
    await assertUserIsActive(userId);
    const sessions = await session_model_1.default.find({
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    })
        .sort({ createdAt: -1 })
        .lean();
    return sessions.map((session) => ({
        id: String(session._id),
        device: session.device,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        isCurrent: currentSessionId ? String(session._id) === currentSessionId : false,
    }));
};
exports.listMyActiveSessions = listMyActiveSessions;
const invalidateMySession = async (userId, sessionId) => {
    await assertUserIsActive(userId);
    if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
        throw new error_middleware_1.AppError('Invalid session id', 400);
    }
    const session = await session_model_1.default.findOne({
        _id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    });
    if (!session) {
        throw new error_middleware_1.AppError('Session not found', 404);
    }
    session.revokedAt = new Date();
    await session.save();
    await user_model_1.default.updateOne({ _id: userId, 'refreshTokens.sessionId': session._id }, { $set: { 'refreshTokens.$.revokedAt': new Date() } });
};
exports.invalidateMySession = invalidateMySession;
const restoreDeletedUserAccount = async (userId) => {
    const restoredUser = await user_model_1.default.findOneAndUpdate({ _id: userId, isDeleted: true }, {
        $set: {
            isDeleted: false,
            deletedAt: null,
        },
        $currentDate: { updatedAt: true },
    }, {
        new: true,
        runValidators: true,
        projection: safeUserProjection,
        timestamps: true,
        withDeleted: true,
    }).lean();
    if (!restoredUser) {
        throw new error_middleware_1.AppError('Deleted user not found', 404);
    }
    return restoredUser;
};
exports.restoreDeletedUserAccount = restoreDeletedUserAccount;
