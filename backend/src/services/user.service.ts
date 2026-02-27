import UserModel from '../models/user.model';
import { AppError } from '../middleware/error.middleware';
import type { ChangePasswordPayload, ProfileUpdatePayload } from '../utils/constants';
import { deleteFileFromS3, getSignedProfilePhotoUrl, uploadProfilePhotoToS3 } from './s3.service';
import { hashPassword, verifyPassword } from '../utils/hash';
import SessionModel from '../models/session.model';
import { Types } from 'mongoose';

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
} as const;

const assertUserIsActive = async (userId: string): Promise<void> => {
	const user = await UserModel.findById(userId).select('_id isDeleted').lean();

	if (!user) {
		throw new AppError('User not found', 404);
	}

	if (user.isDeleted) {
		throw new AppError('User account is deleted', 410);
	}
};

export const getMyProfile = async (userId: string) => {
	await assertUserIsActive(userId);

	const user = await UserModel.findOne({ _id: userId, isDeleted: false }, safeUserProjection).lean();

	if (!user) {
		throw new AppError('User not found', 404);
	}

	return user;
};

export const updateMyProfile = async (userId: string, payload: ProfileUpdatePayload) => {
	await assertUserIsActive(userId);

	const updatePayload: ProfileUpdatePayload = {};

	if (payload.name !== undefined) {
		updatePayload.name = payload.name;
	}

	if (payload.phone !== undefined) {
		const existingPhoneOwner = await UserModel.findOne({
			phone: payload.phone,
			isDeleted: false,
			_id: { $ne: userId },
		})
			.select('_id')
			.lean();

		if (existingPhoneOwner) {
			throw new AppError('Phone is already in use', 409);
		}

		updatePayload.phone = payload.phone;
	}

	if (Object.keys(updatePayload).length === 0) {
		throw new AppError('No allowed fields provided for update', 400);
	}

	const updatedUser = await UserModel.findOneAndUpdate(
		{ _id: userId, isDeleted: false },
		{
			$set: updatePayload,
			$currentDate: { updatedAt: true },
		},
		{ new: true, runValidators: true, projection: safeUserProjection, timestamps: true },
	).lean();

	if (!updatedUser) {
		throw new AppError('User not found', 404);
	}

	return updatedUser;
};

export const softDeleteMyAccount = async (userId: string): Promise<void> => {
	const updated = await UserModel.updateOne(
		{ _id: userId, isDeleted: false },
		{
			$set: {
				isDeleted: true,
				deletedAt: new Date(),
				refreshTokens: [],
			},
		},
	);

	if (updated.matchedCount === 0) {
		throw new AppError('User not found', 404);
	}
};

export const uploadMyProfilePhoto = async (
	userId: string,
	file: { buffer: Buffer; mimetype: string },
) => {
	await assertUserIsActive(userId);

	const existingUser = await UserModel.findOne({ _id: userId, isDeleted: false })
		.select('_id profileImageKey')
		.lean();

	if (!existingUser) {
		throw new AppError('User not found', 404);
	}

	const uploaded = await uploadProfilePhotoToS3({
		userId,
		buffer: file.buffer,
		mimeType: file.mimetype,
	});

	if (existingUser.profileImageKey) {
		await deleteFileFromS3(existingUser.profileImageKey);
	}

	const updatedUser = await UserModel.findOneAndUpdate(
		{ _id: userId, isDeleted: false },
		{
			$set: {
				profileImageKey: uploaded.objectKey,
				profileImageUrl: uploaded.objectUrl,
			},
			$currentDate: { updatedAt: true },
		},
		{ new: true, runValidators: true, projection: safeUserProjection, timestamps: true },
	).lean();

	if (!updatedUser) {
		throw new AppError('User not found', 404);
	}

	const signedProfileImageUrl = await getSignedProfilePhotoUrl(uploaded.objectKey);

	return {
		...updatedUser,
		signedProfileImageUrl,
	};
};

export const changeMyPassword = async (userId: string, payload: ChangePasswordPayload): Promise<void> => {
	await assertUserIsActive(userId);

	const user = await UserModel.findOne({ _id: userId, isDeleted: false }).select('_id passwordHash');

	if (!user) {
		throw new AppError('User not found', 404);
	}

	if (!user.passwordHash) {
		throw new AppError('Password login is not enabled for this account', 400);
	}

	const currentPasswordMatches = await verifyPassword(payload.currentPassword, user.passwordHash);
	if (!currentPasswordMatches) {
		throw new AppError('currentPassword is incorrect', 401);
	}

	const newMatchesCurrent = await verifyPassword(payload.newPassword, user.passwordHash);
	if (newMatchesCurrent) {
		throw new AppError('newPassword must be different from currentPassword', 400);
	}

	const newPasswordHash = await hashPassword(payload.newPassword);

	await UserModel.updateOne(
		{ _id: userId, isDeleted: false },
		{
			$set: {
				passwordHash: newPasswordHash,
				passwordChangedAt: new Date(),
				refreshTokens: [],
			},
			$currentDate: { updatedAt: true },
		},
	);

	await SessionModel.updateMany(
		{ userId, revokedAt: null, expiresAt: { $gt: new Date() } },
		{ $set: { revokedAt: new Date() } },
	);
};

export const listMyActiveSessions = async (userId: string, currentSessionId?: string) => {
	await assertUserIsActive(userId);

	const sessions = await SessionModel.find({
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

export const invalidateMySession = async (userId: string, sessionId: string): Promise<void> => {
	await assertUserIsActive(userId);

	if (!Types.ObjectId.isValid(sessionId)) {
		throw new AppError('Invalid session id', 400);
	}

	const session = await SessionModel.findOne({
		_id: sessionId,
		userId,
		revokedAt: null,
		expiresAt: { $gt: new Date() },
	});

	if (!session) {
		throw new AppError('Session not found', 404);
	}

	session.revokedAt = new Date();
	await session.save();

	await UserModel.updateOne(
		{ _id: userId, 'refreshTokens.sessionId': session._id },
		{ $set: { 'refreshTokens.$.revokedAt': new Date() } },
	);
};

export const restoreDeletedUserAccount = async (userId: string) => {
	const restoredUser = await UserModel.findOneAndUpdate(
		{ _id: userId, isDeleted: true },
		{
			$set: {
				isDeleted: false,
				deletedAt: null,
			},
			$currentDate: { updatedAt: true },
		},
		{
			new: true,
			runValidators: true,
			projection: safeUserProjection,
			timestamps: true,
			withDeleted: true,
		},
	).lean();

	if (!restoredUser) {
		throw new AppError('Deleted user not found', 404);
	}

	return restoredUser;
};

