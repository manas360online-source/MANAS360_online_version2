import mongoose, { Types } from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

jest.mock('../src/services/s3.service', () => ({
	uploadProfilePhotoToS3: jest.fn().mockResolvedValue({
		objectKey: 'users/mock-user/profile/mock-photo.jpg',
		objectUrl: 'https://test-private-bucket.s3.ap-south-1.amazonaws.com/users/mock-user/profile/mock-photo.jpg',
	}),
	deleteFileFromS3: jest.fn().mockResolvedValue(undefined),
	getSignedProfilePhotoUrl: jest.fn().mockResolvedValue('https://signed.example.com/profile-photo'),
}));

import app from '../src/app';
import { createAccessToken } from '../src/utils/jwt';
import { hashPassword, verifyPassword } from '../src/utils/hash';
import UserModel from '../src/models/user.model';
import SessionModel from '../src/models/session.model';

const buildAuthHeader = (userId: string, sessionId = 'current-session-id'): string => {
	const token = createAccessToken({
		sub: userId,
		sessionId,
		jti: `jti-${Date.now()}`,
	});

	return `Bearer ${token}`;
};

describe('User Management API Integration', () => {
	let mongoServer: MongoMemoryServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
	});

	afterEach(async () => {
		const collections = mongoose.connection.collections;
		await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	it('1) gets profile', async () => {
		const passwordHash = await hashPassword('Old@1234');
		const user = await UserModel.create({
			email: 'profile@example.com',
			name: 'Profile User',
			phone: '+919111111111',
			passwordHash,
		});

		const response = await request(app)
			.get('/api/v1/users/me')
			.set('Authorization', buildAuthHeader(String(user._id)));

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.email).toBe('profile@example.com');
		expect(response.body.data.passwordHash).toBeUndefined();
		expect(response.body.data.refreshTokens).toBeUndefined();
	});

	it('2) updates profile', async () => {
		const passwordHash = await hashPassword('Old@1234');
		const user = await UserModel.create({
			email: 'update@example.com',
			name: 'Old Name',
			phone: '+919222222222',
			passwordHash,
		});

		const response = await request(app)
			.patch('/api/v1/users/me')
			.set('Authorization', buildAuthHeader(String(user._id)))
			.send({
				name: 'Updated User',
				phone: '+919333333333',
			});

		expect(response.status).toBe(200);
		expect(response.body.data.name).toBe('Updated User');
		expect(response.body.data.phone).toBe('+919333333333');
	});

	it('3) uploads profile photo (with mocked S3)', async () => {
		const passwordHash = await hashPassword('Old@1234');
		const user = await UserModel.create({
			email: 'photo@example.com',
			name: 'Photo User',
			phone: '+919444444444',
			passwordHash,
		});

		const response = await request(app)
			.post('/api/v1/users/me/photo')
			.set('Authorization', buildAuthHeader(String(user._id)))
			.attach('photo', Buffer.from('mock-image-data'), {
				filename: 'avatar.png',
				contentType: 'image/png',
			});

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.profileImageUrl).toContain('https://test-private-bucket.s3.ap-south-1.amazonaws.com');
		expect(response.body.data.signedProfileImageUrl).toBe('https://signed.example.com/profile-photo');
	});

	it('4) changes password and invalidates all sessions', async () => {
		const userId = new Types.ObjectId();
		const oldPasswordHash = await hashPassword('Old@1234');
+
		await UserModel.create({
			_id: userId,
			email: 'password@example.com',
			name: 'Password User',
			phone: '+919555555555',
			passwordHash: oldPasswordHash,
			refreshTokens: [
				{
					jti: 'token-jti-1',
					tokenHash: 'token-hash-1',
					expiresAt: new Date(Date.now() + 60_000),
					revokedAt: null,
					sessionId: new Types.ObjectId(),
				},
			],
		});

		await SessionModel.create([
			{
				userId,
				jti: 'session-jti-1',
				refreshTokenHash: 'hash-1',
				expiresAt: new Date(Date.now() + 1000 * 60 * 60),
				revokedAt: null,
				device: 'Chrome',
				ipAddress: '10.0.0.1',
				lastActiveAt: new Date(),
			},
			{
				userId,
				jti: 'session-jti-2',
				refreshTokenHash: 'hash-2',
				expiresAt: new Date(Date.now() + 1000 * 60 * 60),
				revokedAt: null,
				device: 'Safari',
				ipAddress: '10.0.0.2',
				lastActiveAt: new Date(),
			},
		]);

		const response = await request(app)
			.patch('/api/v1/users/me/password')
			.set('Authorization', buildAuthHeader(String(userId)))
			.send({
				currentPassword: 'Old@1234',
				newPassword: 'New@5678',
				confirmPassword: 'New@5678',
			});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Password updated successfully');

		const updatedUser = await UserModel.findOne({ _id: userId }).setOptions({ withDeleted: true });
		expect(updatedUser).not.toBeNull();
		expect(updatedUser?.passwordChangedAt).toBeTruthy();
		expect(updatedUser?.refreshTokens.length).toBe(0);
		const passwordMatches = await verifyPassword('New@5678', updatedUser?.passwordHash ?? '');
		expect(passwordMatches).toBe(true);

		const activeSessions = await SessionModel.countDocuments({ userId, revokedAt: null });
		expect(activeSessions).toBe(0);
	});

	it('5) lists active sessions', async () => {
		const userId = new Types.ObjectId();
		const currentSessionId = new Types.ObjectId();
		await UserModel.create({
			_id: userId,
			email: 'sessionlist@example.com',
			name: 'Session List User',
			phone: '+919666666666',
			passwordHash: await hashPassword('Old@1234'),
		});

		await SessionModel.create([
			{
				_id: currentSessionId,
				userId,
				jti: 'active-1',
				refreshTokenHash: 'rt1',
				expiresAt: new Date(Date.now() + 60_000),
				revokedAt: null,
				device: 'MacBook',
				ipAddress: '192.168.0.2',
				lastActiveAt: new Date(),
			},
			{
				userId,
				jti: 'active-2',
				refreshTokenHash: 'rt2',
				expiresAt: new Date(Date.now() + 60_000),
				revokedAt: null,
				device: 'iPhone',
				ipAddress: '192.168.0.3',
				lastActiveAt: new Date(),
			},
			{
				userId,
				jti: 'revoked-1',
				refreshTokenHash: 'rt3',
				expiresAt: new Date(Date.now() + 60_000),
				revokedAt: new Date(),
				device: 'Android',
				ipAddress: '192.168.0.4',
				lastActiveAt: new Date(),
			},
		]);

		const response = await request(app)
			.get('/api/v1/users/me/sessions')
			.set('Authorization', buildAuthHeader(String(userId), String(currentSessionId)));

		expect(response.status).toBe(200);
		expect(response.body.data).toHaveLength(2);
		expect(response.body.data[0]).toHaveProperty('device');
		expect(response.body.data[0]).toHaveProperty('ipAddress');
		expect(response.body.data[0]).toHaveProperty('createdAt');
		expect(response.body.data[0]).toHaveProperty('lastActiveAt');
	});

	it('6) deletes specific session and returns 404 for non-existing session', async () => {
		const userId = new Types.ObjectId();
		const targetSessionId = new Types.ObjectId();
		await UserModel.create({
			_id: userId,
			email: 'delete-session@example.com',
			name: 'Delete Session User',
			phone: '+919777777777',
			passwordHash: await hashPassword('Old@1234'),
			refreshTokens: [
				{
					jti: 'target-jti',
					tokenHash: 'target-token-hash',
					expiresAt: new Date(Date.now() + 100_000),
					revokedAt: null,
					sessionId: targetSessionId,
				},
			],
		});
+
		await SessionModel.create({
			_id: targetSessionId,
			userId,
			jti: 'target-jti',
			refreshTokenHash: 'target-token-hash',
			expiresAt: new Date(Date.now() + 100_000),
			revokedAt: null,
			device: 'Firefox',
			ipAddress: '172.16.0.10',
			lastActiveAt: new Date(),
		});

		const deleteResponse = await request(app)
			.delete(`/api/v1/users/me/sessions/${targetSessionId.toString()}`)
			.set('Authorization', buildAuthHeader(String(userId)));

		expect(deleteResponse.status).toBe(200);
		expect(deleteResponse.body.message).toBe('Session invalidated successfully');

		const revokedSession = await SessionModel.findById(targetSessionId).lean();
		expect(revokedSession?.revokedAt).toBeTruthy();

		const missingSessionId = new Types.ObjectId();
		const missingResponse = await request(app)
			.delete(`/api/v1/users/me/sessions/${missingSessionId.toString()}`)
			.set('Authorization', buildAuthHeader(String(userId)));

		expect(missingResponse.status).toBe(404);
		expect(missingResponse.body.message).toBe('Session not found');
	});

	it('7) soft deletes account', async () => {
		const userId = new Types.ObjectId();
		await UserModel.create({
			_id: userId,
			email: 'soft-delete@example.com',
			name: 'Soft Delete User',
			phone: '+919888888888',
			passwordHash: await hashPassword('Old@1234'),
			refreshTokens: [
				{
					jti: 'delete-jti',
					tokenHash: 'delete-hash',
					expiresAt: new Date(Date.now() + 60_000),
					revokedAt: null,
					sessionId: new Types.ObjectId(),
				},
			],
		});

		const response = await request(app)
			.delete('/api/v1/users/me')
			.set('Authorization', buildAuthHeader(String(userId)));

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Account deleted');

		const deletedUser = await UserModel.findOne({ _id: userId }).setOptions({ withDeleted: true }).lean();
		expect(deletedUser?.isDeleted).toBe(true);
		expect(deletedUser?.deletedAt).toBeTruthy();
		expect(deletedUser?.refreshTokens).toHaveLength(0);
	});
});
