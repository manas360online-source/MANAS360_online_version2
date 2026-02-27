"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeSession = exports.getActiveSessions = exports.verifyAndEnableMfa = exports.setupMfa = exports.resetPassword = exports.requestPasswordReset = exports.logoutSession = exports.refreshAuthTokens = exports.loginWithGoogle = exports.loginWithPassword = exports.verifyPhoneOtp = exports.registerWithPhone = exports.verifyEmailOtp = exports.registerWithEmail = void 0;
const crypto_1 = require("crypto");
const otplib_1 = require("otplib");
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("../config/env");
const user_model_1 = __importDefault(require("../models/user.model"));
const session_model_1 = __importDefault(require("../models/session.model"));
const audit_model_1 = __importDefault(require("../models/audit.model"));
const error_middleware_1 = require("../middleware/error.middleware");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const googleClient = new google_auth_library_1.OAuth2Client(env_1.env.googleClientId);
const nowPlusMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000);
const nowPlusDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const audit = async (event, status, meta, context = {}) => {
    await audit_model_1.default.create({
        event,
        status,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        ...context,
    });
};
const issueSessionTokens = async (userId, meta) => {
    const provisionalSessionId = (0, crypto_1.randomBytes)(12).toString('hex');
    const tokenPair = (0, jwt_1.createTokenPair)(userId, provisionalSessionId);
    const refreshTokenHash = (0, hash_1.hashOpaqueToken)(tokenPair.refreshToken);
    const session = await session_model_1.default.create({
        userId,
        jti: tokenPair.refreshJti,
        refreshTokenHash,
        expiresAt: nowPlusDays(7),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        device: meta.device,
    });
    await user_model_1.default.updateOne({ _id: userId }, {
        $push: {
            refreshTokens: {
                jti: tokenPair.refreshJti,
                tokenHash: refreshTokenHash,
                expiresAt: nowPlusDays(7),
                sessionId: session._id,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
            },
        },
    });
    const finalTokenPair = (0, jwt_1.createTokenPair)(userId, String(session._id));
    const finalRefreshTokenHash = (0, hash_1.hashOpaqueToken)(finalTokenPair.refreshToken);
    await session_model_1.default.updateOne({ _id: session._id }, { jti: finalTokenPair.refreshJti, refreshTokenHash: finalRefreshTokenHash });
    await user_model_1.default.updateOne({ _id: userId, 'refreshTokens.jti': tokenPair.refreshJti }, {
        $set: {
            'refreshTokens.$.jti': finalTokenPair.refreshJti,
            'refreshTokens.$.tokenHash': finalRefreshTokenHash,
        },
    });
    return finalTokenPair;
};
const registerWithEmail = async (input, meta) => {
    const existing = await user_model_1.default.findOne({ email: input.email.toLowerCase() }).setOptions({ withDeleted: true });
    if (existing) {
        if (existing.isDeleted) {
            throw new error_middleware_1.AppError('Account is deleted. Contact support to restore access.', 410);
        }
        throw new error_middleware_1.AppError('Email already registered', 409);
    }
    const passwordHash = await (0, hash_1.hashPassword)(input.password);
    const otp = (0, hash_1.generateNumericOtp)();
    const otpHash = await (0, hash_1.hashOtp)(otp);
    const user = await user_model_1.default.create({
        email: input.email.toLowerCase(),
        passwordHash,
        emailVerificationOtpHash: otpHash,
        emailVerificationOtpExpiresAt: nowPlusMinutes(env_1.env.otpTtlMinutes),
        provider: 'local',
    });
    await audit('REGISTER_SUCCESS', 'success', meta, { userId: user._id, email: user.email });
    return {
        userId: String(user._id),
        email: user.email,
        message: 'Registration successful. Verify your email OTP.',
        devOtp: env_1.env.nodeEnv !== 'production' ? otp : undefined,
    };
};
exports.registerWithEmail = registerWithEmail;
const verifyEmailOtp = async (input) => {
    const user = await user_model_1.default.findOne({ email: input.email.toLowerCase() });
    if (!user || !user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
        throw new error_middleware_1.AppError('Invalid verification request', 400);
    }
    if (user.emailVerificationOtpExpiresAt < new Date()) {
        throw new error_middleware_1.AppError('OTP expired', 400);
    }
    const validOtp = await (0, hash_1.verifyOtp)(input.otp, user.emailVerificationOtpHash);
    if (!validOtp) {
        throw new error_middleware_1.AppError('Invalid OTP', 400);
    }
    user.emailVerified = true;
    user.emailVerificationOtpHash = null;
    user.emailVerificationOtpExpiresAt = null;
    await user.save();
};
exports.verifyEmailOtp = verifyEmailOtp;
const registerWithPhone = async (input) => {
    const existing = await user_model_1.default.findOne({ phone: input.phone }).setOptions({ withDeleted: true });
    if (existing) {
        if (existing.isDeleted) {
            throw new error_middleware_1.AppError('Account is deleted. Contact support to restore access.', 410);
        }
        throw new error_middleware_1.AppError('Phone already registered', 409);
    }
    const otp = (0, hash_1.generateNumericOtp)();
    const otpHash = await (0, hash_1.hashOtp)(otp);
    const user = await user_model_1.default.create({
        phone: input.phone,
        phoneVerificationOtpHash: otpHash,
        phoneVerificationOtpExpiresAt: nowPlusMinutes(env_1.env.otpTtlMinutes),
        provider: 'phone',
    });
    return {
        userId: String(user._id),
        phone: user.phone,
        message: 'Phone OTP sent.',
        devOtp: env_1.env.nodeEnv !== 'production' ? otp : undefined,
    };
};
exports.registerWithPhone = registerWithPhone;
const verifyPhoneOtp = async (input) => {
    const user = await user_model_1.default.findOne({ phone: input.phone });
    if (!user || !user.phoneVerificationOtpHash || !user.phoneVerificationOtpExpiresAt) {
        throw new error_middleware_1.AppError('Invalid verification request', 400);
    }
    if (user.phoneVerificationOtpExpiresAt < new Date()) {
        throw new error_middleware_1.AppError('OTP expired', 400);
    }
    const validOtp = await (0, hash_1.verifyOtp)(input.otp, user.phoneVerificationOtpHash);
    if (!validOtp) {
        throw new error_middleware_1.AppError('Invalid OTP', 400);
    }
    user.phoneVerified = true;
    user.phoneVerificationOtpHash = null;
    user.phoneVerificationOtpExpiresAt = null;
    await user.save();
};
exports.verifyPhoneOtp = verifyPhoneOtp;
const resolveUserByIdentifier = async (identifier) => {
    const isEmail = identifier.includes('@');
    return user_model_1.default.findOne(isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }).setOptions({
        withDeleted: true,
    });
};
const loginWithPassword = async (input, meta) => {
    const user = await resolveUserByIdentifier(input.identifier);
    if (!user || !user.passwordHash) {
        await audit('LOGIN_FAILED', 'failure', meta, { email: input.identifier });
        throw new error_middleware_1.AppError('Invalid credentials', 401);
    }
    if (user.isDeleted) {
        await audit('LOGIN_FAILED', 'failure', meta, { email: input.identifier, userId: user._id });
        throw new error_middleware_1.AppError('User account is deleted', 410);
    }
    if (user.lockUntil && user.lockUntil > new Date()) {
        throw new error_middleware_1.AppError('Account temporarily locked. Try again later.', 423);
    }
    const validPassword = await (0, hash_1.verifyPassword)(input.password, user.passwordHash);
    if (!validPassword) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= env_1.env.maxLoginAttempts) {
            user.lockUntil = nowPlusMinutes(env_1.env.lockoutWindowMinutes);
            await audit('LOCKOUT_TRIGGERED', 'failure', meta, { userId: user._id, email: user.email });
        }
        await user.save();
        await audit('LOGIN_FAILED', 'failure', meta, { userId: user._id, email: user.email });
        throw new error_middleware_1.AppError('Invalid credentials', 401);
    }
    if (user.mfaEnabled) {
        if (!input.mfaCode || !user.mfaSecret || !otplib_1.authenticator.check(input.mfaCode, user.mfaSecret)) {
            throw new error_middleware_1.AppError('Invalid MFA code', 401);
        }
    }
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();
    const tokenPair = await issueSessionTokens(String(user._id), meta);
    await audit('LOGIN_SUCCESS', 'success', meta, { userId: user._id, email: user.email, phone: user.phone });
    return {
        user: {
            id: String(user._id),
            email: user.email,
            phone: user.phone,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            mfaEnabled: user.mfaEnabled,
        },
        ...tokenPair,
    };
};
exports.loginWithPassword = loginWithPassword;
const loginWithGoogle = async (input, meta) => {
    if (!env_1.env.googleClientId) {
        throw new error_middleware_1.AppError('Google OAuth is not configured', 500);
    }
    const ticket = await googleClient.verifyIdToken({
        idToken: input.idToken,
        audience: env_1.env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) {
        throw new error_middleware_1.AppError('Invalid Google token', 401);
    }
    let user = await user_model_1.default.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email?.toLowerCase() }] }).setOptions({ withDeleted: true });
    if (user?.isDeleted) {
        throw new error_middleware_1.AppError('User account is deleted', 410);
    }
    if (!user) {
        user = await user_model_1.default.create({
            email: payload.email?.toLowerCase(),
            emailVerified: payload.email_verified ?? false,
            googleId: payload.sub,
            provider: 'google',
        });
    }
    else if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
    }
    const tokenPair = await issueSessionTokens(String(user._id), meta);
    await audit('LOGIN_SUCCESS', 'success', meta, { userId: user._id, email: user.email });
    return {
        user: {
            id: String(user._id),
            email: user.email,
            phone: user.phone,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            mfaEnabled: user.mfaEnabled,
        },
        ...tokenPair,
    };
};
exports.loginWithGoogle = loginWithGoogle;
const refreshAuthTokens = async (input, meta) => {
    const payload = (0, jwt_1.verifyRefreshToken)(input.refreshToken);
    const refreshTokenHash = (0, hash_1.hashOpaqueToken)(input.refreshToken);
    const session = await session_model_1.default.findOne({
        _id: payload.sessionId,
        jti: payload.jti,
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    });
    if (!session) {
        throw new error_middleware_1.AppError('Invalid refresh token', 401);
    }
    session.revokedAt = new Date();
    await session.save();
    await user_model_1.default.updateOne({ _id: payload.sub, 'refreshTokens.jti': payload.jti }, { $set: { 'refreshTokens.$.revokedAt': new Date() } });
    const tokenPair = await issueSessionTokens(payload.sub, meta);
    await audit('TOKEN_REFRESHED', 'success', meta, { userId: payload.sub });
    return tokenPair;
};
exports.refreshAuthTokens = refreshAuthTokens;
const logoutSession = async (sessionId, userId, meta) => {
    await session_model_1.default.updateOne({ _id: sessionId, userId }, { revokedAt: new Date() });
    await user_model_1.default.updateOne({ _id: userId, 'refreshTokens.sessionId': sessionId }, { $set: { 'refreshTokens.$.revokedAt': new Date() } });
    await audit('LOGOUT', 'success', meta, { userId });
};
exports.logoutSession = logoutSession;
const requestPasswordReset = async (input, meta) => {
    const user = await resolveUserByIdentifier(input.identifier);
    if (user) {
        const otp = (0, hash_1.generateNumericOtp)();
        user.passwordResetOtpHash = await (0, hash_1.hashOtp)(otp);
        user.passwordResetOtpExpiresAt = nowPlusMinutes(env_1.env.resetOtpTtlMinutes);
        await user.save();
        await audit('PASSWORD_RESET_REQUESTED', 'success', meta, { userId: user._id, email: user.email });
        return {
            message: 'Password reset OTP sent.',
            devOtp: env_1.env.nodeEnv !== 'production' ? otp : undefined,
        };
    }
    return { message: 'If the account exists, reset instructions were sent.' };
};
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = async (input, meta) => {
    const user = await resolveUserByIdentifier(input.identifier);
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
        throw new error_middleware_1.AppError('Invalid reset request', 400);
    }
    if (user.passwordResetOtpExpiresAt < new Date()) {
        throw new error_middleware_1.AppError('Reset OTP expired', 400);
    }
    const validOtp = await (0, hash_1.verifyOtp)(input.otp, user.passwordResetOtpHash);
    if (!validOtp) {
        throw new error_middleware_1.AppError('Invalid OTP', 400);
    }
    user.passwordHash = await (0, hash_1.hashPassword)(input.newPassword);
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.refreshTokens.splice(0, user.refreshTokens.length);
    await user.save();
    await session_model_1.default.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
    await audit('PASSWORD_RESET_SUCCESS', 'success', meta, { userId: user._id, email: user.email });
};
exports.resetPassword = resetPassword;
const setupMfa = async (input) => {
    const user = await user_model_1.default.findById(input.userId);
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    const secret = otplib_1.authenticator.generateSecret();
    user.mfaSecret = secret;
    await user.save();
    const otpauthUrl = otplib_1.authenticator.keyuri(user.email ?? user.phone ?? String(user._id), env_1.env.mfaIssuer, secret);
    return {
        secret,
        otpauthUrl,
    };
};
exports.setupMfa = setupMfa;
const verifyAndEnableMfa = async (input) => {
    const user = await user_model_1.default.findById(input.userId);
    if (!user || !user.mfaSecret) {
        throw new error_middleware_1.AppError('MFA setup not initialized', 400);
    }
    if (!otplib_1.authenticator.check(input.code, user.mfaSecret)) {
        throw new error_middleware_1.AppError('Invalid MFA verification code', 400);
    }
    user.mfaEnabled = true;
    await user.save();
};
exports.verifyAndEnableMfa = verifyAndEnableMfa;
const getActiveSessions = async (userId) => {
    const sessions = await session_model_1.default.find({
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
    return sessions.map((session) => ({
        id: String(session._id),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        device: session.device,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
    }));
};
exports.getActiveSessions = getActiveSessions;
const revokeSession = async (userId, sessionId) => {
    const session = await session_model_1.default.findOne({ _id: sessionId, userId, revokedAt: null });
    if (!session) {
        throw new error_middleware_1.AppError('Session not found', 404);
    }
    session.revokedAt = new Date();
    await session.save();
};
exports.revokeSession = revokeSession;
