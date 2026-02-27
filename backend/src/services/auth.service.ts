import { randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import UserModel from '../models/user.model';
import SessionModel from '../models/session.model';
import AuditModel from '../models/audit.model';
import { AppError } from '../middleware/error.middleware';
import {
	hashOpaqueToken,
	hashOtp,
	hashPassword,
	generateNumericOtp,
	verifyOtp,
	verifyPassword,
} from '../utils/hash';
import { createTokenPair, verifyRefreshToken } from '../utils/jwt';
import type {
	GoogleLoginInput,
	LoginInput,
	MfaSetupInput,
	MfaVerifyInput,
	PasswordResetInput,
	PasswordResetRequestInput,
	RefreshInput,
	RegisterEmailInput,
	RegisterPhoneInput,
	RequestMeta,
	VerifyEmailOtpInput,
	VerifyPhoneOtpInput,
} from '../types/auth.types';

const googleClient = new OAuth2Client(env.googleClientId);

const nowPlusMinutes = (minutes: number): Date => new Date(Date.now() + minutes * 60 * 1000);

const nowPlusDays = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const audit = async (
	event: string,
	status: 'success' | 'failure',
	meta: RequestMeta,
	context: Record<string, unknown> = {},
): Promise<void> => {
	await AuditModel.create({
		event,
		status,
		ipAddress: meta.ipAddress,
		userAgent: meta.userAgent,
		...context,
	});
};

const issueSessionTokens = async (userId: string, meta: RequestMeta) => {
	const provisionalSessionId = randomBytes(12).toString('hex');
	const tokenPair = createTokenPair(userId, provisionalSessionId);
	const refreshTokenHash = hashOpaqueToken(tokenPair.refreshToken);

	const session = await SessionModel.create({
		userId,
		jti: tokenPair.refreshJti,
		refreshTokenHash,
		expiresAt: nowPlusDays(7),
		ipAddress: meta.ipAddress,
		userAgent: meta.userAgent,
		device: meta.device,
	});

	await UserModel.updateOne(
		{ _id: userId },
		{
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
		},
	);

	const finalTokenPair = createTokenPair(userId, String(session._id));
	const finalRefreshTokenHash = hashOpaqueToken(finalTokenPair.refreshToken);

	await SessionModel.updateOne(
		{ _id: session._id },
		{ jti: finalTokenPair.refreshJti, refreshTokenHash: finalRefreshTokenHash },
	);

	await UserModel.updateOne(
		{ _id: userId, 'refreshTokens.jti': tokenPair.refreshJti },
		{
			$set: {
				'refreshTokens.$.jti': finalTokenPair.refreshJti,
				'refreshTokens.$.tokenHash': finalRefreshTokenHash,
			},
		},
	);

	return finalTokenPair;
};

export const registerWithEmail = async (input: RegisterEmailInput, meta: RequestMeta) => {
	const existing = await UserModel.findOne({ email: input.email.toLowerCase() }).setOptions({ withDeleted: true });
	if (existing) {
		if (existing.isDeleted) {
			throw new AppError('Account is deleted. Contact support to restore access.', 410);
		}

		throw new AppError('Email already registered', 409);
	}

	const passwordHash = await hashPassword(input.password);
	const otp = generateNumericOtp();
	const otpHash = await hashOtp(otp);

	const user = await UserModel.create({
		email: input.email.toLowerCase(),
		passwordHash,
		emailVerificationOtpHash: otpHash,
		emailVerificationOtpExpiresAt: nowPlusMinutes(env.otpTtlMinutes),
		provider: 'local',
	});

	await audit('REGISTER_SUCCESS', 'success', meta, { userId: user._id, email: user.email });

	return {
		userId: String(user._id),
		email: user.email,
		message: 'Registration successful. Verify your email OTP.',
		devOtp: env.nodeEnv !== 'production' ? otp : undefined,
	};
};

export const verifyEmailOtp = async (input: VerifyEmailOtpInput): Promise<void> => {
	const user = await UserModel.findOne({ email: input.email.toLowerCase() });
	if (!user || !user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
		throw new AppError('Invalid verification request', 400);
	}

	if (user.emailVerificationOtpExpiresAt < new Date()) {
		throw new AppError('OTP expired', 400);
	}

	const validOtp = await verifyOtp(input.otp, user.emailVerificationOtpHash);
	if (!validOtp) {
		throw new AppError('Invalid OTP', 400);
	}

	user.emailVerified = true;
	user.emailVerificationOtpHash = null;
	user.emailVerificationOtpExpiresAt = null;
	await user.save();
};

export const registerWithPhone = async (input: RegisterPhoneInput) => {
	const existing = await UserModel.findOne({ phone: input.phone }).setOptions({ withDeleted: true });
	if (existing) {
		if (existing.isDeleted) {
			throw new AppError('Account is deleted. Contact support to restore access.', 410);
		}

		throw new AppError('Phone already registered', 409);
	}

	const otp = generateNumericOtp();
	const otpHash = await hashOtp(otp);

	const user = await UserModel.create({
		phone: input.phone,
		phoneVerificationOtpHash: otpHash,
		phoneVerificationOtpExpiresAt: nowPlusMinutes(env.otpTtlMinutes),
		provider: 'phone',
	});

	return {
		userId: String(user._id),
		phone: user.phone,
		message: 'Phone OTP sent.',
		devOtp: env.nodeEnv !== 'production' ? otp : undefined,
	};
};

export const verifyPhoneOtp = async (input: VerifyPhoneOtpInput): Promise<void> => {
	const user = await UserModel.findOne({ phone: input.phone });
	if (!user || !user.phoneVerificationOtpHash || !user.phoneVerificationOtpExpiresAt) {
		throw new AppError('Invalid verification request', 400);
	}

	if (user.phoneVerificationOtpExpiresAt < new Date()) {
		throw new AppError('OTP expired', 400);
	}

	const validOtp = await verifyOtp(input.otp, user.phoneVerificationOtpHash);
	if (!validOtp) {
		throw new AppError('Invalid OTP', 400);
	}

	user.phoneVerified = true;
	user.phoneVerificationOtpHash = null;
	user.phoneVerificationOtpExpiresAt = null;
	await user.save();
};

const resolveUserByIdentifier = async (identifier: string) => {
	const isEmail = identifier.includes('@');
	return UserModel.findOne(isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }).setOptions({
		withDeleted: true,
	});
};

export const loginWithPassword = async (input: LoginInput, meta: RequestMeta) => {
	const user = await resolveUserByIdentifier(input.identifier);
	if (!user || !user.passwordHash) {
		await audit('LOGIN_FAILED', 'failure', meta, { email: input.identifier });
		throw new AppError('Invalid credentials', 401);
	}

	if (user.isDeleted) {
		await audit('LOGIN_FAILED', 'failure', meta, { email: input.identifier, userId: user._id });
		throw new AppError('User account is deleted', 410);
	}

	if (user.lockUntil && user.lockUntil > new Date()) {
		throw new AppError('Account temporarily locked. Try again later.', 423);
	}

	const validPassword = await verifyPassword(input.password, user.passwordHash);
	if (!validPassword) {
		user.failedLoginAttempts += 1;

		if (user.failedLoginAttempts >= env.maxLoginAttempts) {
			user.lockUntil = nowPlusMinutes(env.lockoutWindowMinutes);
			await audit('LOCKOUT_TRIGGERED', 'failure', meta, { userId: user._id, email: user.email });
		}

		await user.save();
		await audit('LOGIN_FAILED', 'failure', meta, { userId: user._id, email: user.email });
		throw new AppError('Invalid credentials', 401);
	}

	if (user.mfaEnabled) {
		if (!input.mfaCode || !user.mfaSecret || !authenticator.check(input.mfaCode, user.mfaSecret)) {
			throw new AppError('Invalid MFA code', 401);
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

export const loginWithGoogle = async (input: GoogleLoginInput, meta: RequestMeta) => {
	if (!env.googleClientId) {
		throw new AppError('Google OAuth is not configured', 500);
	}

	const ticket = await googleClient.verifyIdToken({
		idToken: input.idToken,
		audience: env.googleClientId,
	});

	const payload = ticket.getPayload();
	if (!payload?.sub) {
		throw new AppError('Invalid Google token', 401);
	}

	let user = await UserModel.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email?.toLowerCase() }] }).setOptions({ withDeleted: true });

	if (user?.isDeleted) {
		throw new AppError('User account is deleted', 410);
	}

	if (!user) {
		user = await UserModel.create({
			email: payload.email?.toLowerCase(),
			emailVerified: payload.email_verified ?? false,
			googleId: payload.sub,
			provider: 'google',
		});
	} else if (!user.googleId) {
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

export const refreshAuthTokens = async (input: RefreshInput, meta: RequestMeta) => {
	const payload = verifyRefreshToken(input.refreshToken);
	const refreshTokenHash = hashOpaqueToken(input.refreshToken);

	const session = await SessionModel.findOne({
		_id: payload.sessionId,
		jti: payload.jti,
		refreshTokenHash,
		revokedAt: null,
		expiresAt: { $gt: new Date() },
	});

	if (!session) {
		throw new AppError('Invalid refresh token', 401);
	}

	session.revokedAt = new Date();
	await session.save();

	await UserModel.updateOne(
		{ _id: payload.sub, 'refreshTokens.jti': payload.jti },
		{ $set: { 'refreshTokens.$.revokedAt': new Date() } },
	);

	const tokenPair = await issueSessionTokens(payload.sub, meta);
	await audit('TOKEN_REFRESHED', 'success', meta, { userId: payload.sub });

	return tokenPair;
};

export const logoutSession = async (sessionId: string, userId: string, meta: RequestMeta): Promise<void> => {
	await SessionModel.updateOne({ _id: sessionId, userId }, { revokedAt: new Date() });
	await UserModel.updateOne(
		{ _id: userId, 'refreshTokens.sessionId': sessionId },
		{ $set: { 'refreshTokens.$.revokedAt': new Date() } },
	);

	await audit('LOGOUT', 'success', meta, { userId });
};

export const requestPasswordReset = async (input: PasswordResetRequestInput, meta: RequestMeta) => {
	const user = await resolveUserByIdentifier(input.identifier);

	if (user) {
		const otp = generateNumericOtp();
		user.passwordResetOtpHash = await hashOtp(otp);
		user.passwordResetOtpExpiresAt = nowPlusMinutes(env.resetOtpTtlMinutes);
		await user.save();

		await audit('PASSWORD_RESET_REQUESTED', 'success', meta, { userId: user._id, email: user.email });

		return {
			message: 'Password reset OTP sent.',
			devOtp: env.nodeEnv !== 'production' ? otp : undefined,
		};
	}

	return { message: 'If the account exists, reset instructions were sent.' };
};

export const resetPassword = async (input: PasswordResetInput, meta: RequestMeta): Promise<void> => {
	const user = await resolveUserByIdentifier(input.identifier);
	if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
		throw new AppError('Invalid reset request', 400);
	}

	if (user.passwordResetOtpExpiresAt < new Date()) {
		throw new AppError('Reset OTP expired', 400);
	}

	const validOtp = await verifyOtp(input.otp, user.passwordResetOtpHash);
	if (!validOtp) {
		throw new AppError('Invalid OTP', 400);
	}

	user.passwordHash = await hashPassword(input.newPassword);
	user.passwordResetOtpHash = null;
	user.passwordResetOtpExpiresAt = null;
	user.refreshTokens.splice(0, user.refreshTokens.length);
	await user.save();

	await SessionModel.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
	await audit('PASSWORD_RESET_SUCCESS', 'success', meta, { userId: user._id, email: user.email });
};

export const setupMfa = async (input: MfaSetupInput) => {
	const user = await UserModel.findById(input.userId);
	if (!user) {
		throw new AppError('User not found', 404);
	}

	const secret = authenticator.generateSecret();
	user.mfaSecret = secret;
	await user.save();

	const otpauthUrl = authenticator.keyuri(user.email ?? user.phone ?? String(user._id), env.mfaIssuer, secret);

	return {
		secret,
		otpauthUrl,
	};
};

export const verifyAndEnableMfa = async (input: MfaVerifyInput): Promise<void> => {
	const user = await UserModel.findById(input.userId);
	if (!user || !user.mfaSecret) {
		throw new AppError('MFA setup not initialized', 400);
	}

	if (!authenticator.check(input.code, user.mfaSecret)) {
		throw new AppError('Invalid MFA verification code', 400);
	}

	user.mfaEnabled = true;
	await user.save();
};

export const getActiveSessions = async (userId: string) => {
	const sessions = await SessionModel.find({
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

export const revokeSession = async (userId: string, sessionId: string): Promise<void> => {
	const session = await SessionModel.findOne({ _id: sessionId, userId, revokedAt: null });
	if (!session) {
		throw new AppError('Session not found', 404);
	}

	session.revokedAt = new Date();
	await session.save();
};
