import request from 'supertest';
import app from '../../src/app';
import {
	connectToTestDB,
	disconnectFromTestDB,
	clearTestDB,
	createAdminUser,
	createPatientUser,
	createTherapistUser,
	createTherapistProfile,
	createSubscription,
	createSession,
	createPayment,
} from '../helpers/db-setup';
import {
	generateAdminToken,
	generatePatientToken,
	generateTherapistToken,
	generateInvalidToken,
} from '../helpers/jwt';

const API_BASE_PATH = '/api/v1/admin';

describe('Admin API Integration Tests', () => {
	beforeAll(async () => {
		await connectToTestDB();
	});

	afterAll(async () => {
		await disconnectFromTestDB();
	});

	beforeEach(async () => {
		await clearTestDB();
	});

	describe('GET /admin/users - List Users', () => {
		it('✓ Admin can fetch users with pagination', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());

			// Create test users
			await createPatientUser({ email: 'patient1@test.com' });
			await createPatientUser({ email: 'patient2@test.com' });
			await createTherapistUser({ email: 'therapist1@test.com' });

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('data');
			expect(response.body.data).toHaveProperty('users');
			expect(response.body.data).toHaveProperty('pagination');
			expect(Array.isArray(response.body.data.users)).toBe(true);
			expect(response.body.data.users.length).toBeLessThanOrEqual(10);
		});

		it('✓ Admin can filter users by role', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());

			await createPatientUser({ email: 'patient1@test.com' });
			await createPatientUser({ email: 'patient2@test.com' });
			await createTherapistUser({ email: 'therapist1@test.com' });

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${token}`)
				.query({ role: 'patient', page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(Array.isArray(response.body.data.users)).toBe(true);
			// All returned users should be patients
			response.body.data.users.forEach((user: any) => {
				expect(user.role).toBe('patient');
			});
		});

		it('✗ Non-admin (patient) gets 403 Forbidden', async () => {
			// Arrange
			const patient = await createPatientUser();
			const token = generatePatientToken(patient._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body.error).toMatch(/admin|forbidden|forbidden.*role/i);
		});

		it('✗ Non-admin (therapist) gets 403 Forbidden', async () => {
			// Arrange
			const therapist = await createTherapistUser();
			const token = generateTherapistToken(therapist._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✗ Missing JWT token gets 401 Unauthorized', async () => {
			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.query({ page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body.error).toMatch(/auth|token|required/i);
		});

		it('✗ Invalid JWT token gets 401 Unauthorized', async () => {
			// Arrange
			const invalidToken = generateInvalidToken('some-user-id');

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${invalidToken}`)
				.query({ page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✓ Respects maximum limit of 50 items per page', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());

			// Create 60 users
			for (let i = 0; i < 60; i++) {
				await createPatientUser({ email: `patient${i}@test.com` });
			}

			// Act - Request with limit > 50 (should be capped at 50)
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 100 });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data.users.length).toBeLessThanOrEqual(50);
		});
	});

	describe('GET /admin/users/:id - Get Single User', () => {
		it('✓ Admin can fetch single user by ID', async () => {
			// Arrange
			const admin = await createAdminUser();
			const patient = await createPatientUser();
			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users/${patient._id}`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty('_id', patient._id.toString());
			expect(response.body.data).toHaveProperty('email', patient.email);
			expect(response.body.data).toHaveProperty('role', 'patient');
		});

		it('✗ Non-admin cannot fetch user details', async () => {
			// Arrange
			const patient1 = await createPatientUser({ email: 'patient1@test.com' });
			const patient2 = await createPatientUser({ email: 'patient2@test.com' });
			const token = generatePatientToken(patient1._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users/${patient2._id}`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✗ Invalid user ID format returns 400', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users/invalid-id-format`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✗ Non-existent user ID returns 404', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());
			const fakeUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users/${fakeUserId}`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✗ Deleted user returns 410 Gone', async () => {
			// Arrange
			const admin = await createAdminUser();
			const deletedUser = await createPatientUser({ isDeleted: true });
			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users/${deletedUser._id}`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(410);
			expect(response.body).toHaveProperty('success', false);
		});
	});

	describe('PATCH /admin/therapists/:id/verify - Verify Therapist', () => {
		it('✓ Admin can verify therapist', async () => {
			// Arrange
			const admin = await createAdminUser();
			const therapist = await createTherapistUser();
			const profile = await createTherapistProfile(therapist._id.toString(), {
				isVerified: false,
			});
			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE_PATH}/therapists/${profile._id}/verify`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty('isVerified', true);
			expect(response.body.data).toHaveProperty('verifiedAt');
			expect(response.body.data).toHaveProperty('verifiedBy', admin._id.toString());
		});

		it('✗ Non-admin cannot verify therapist', async () => {
			// Arrange
			const therapist = await createTherapistUser();
			const profile = await createTherapistProfile(therapist._id.toString());
			const token = generateTherapistToken(therapist._id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE_PATH}/therapists/${profile._id}/verify`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✗ Invalid profile ID format returns 400', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE_PATH}/therapists/invalid-id/verify`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✗ Non-existent profile returns 404', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());
			const fakeProfileId = '507f1f77bcf86cd799439011';

			// Act
			const response = await request(app)
				.patch(`${API_BASE_PATH}/therapists/${fakeProfileId}/verify`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✓ Can verify already verified therapist (idempotent)', async () => {
			// Arrange
			const admin = await createAdminUser();
			const therapist = await createTherapistUser();
			const profile = await createTherapistProfile(therapist._id.toString(), {
				isVerified: true,
				verifiedAt: new Date(),
				verifiedBy: admin._id,
			});
			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.patch(`${API_BASE_PATH}/therapists/${profile._id}/verify`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data.isVerified).toBe(true);
		});
	});

	describe('GET /admin/metrics - Platform Metrics', () => {
		it('✓ Metrics endpoint returns correct summary statistics', async () => {
			// Arrange
			const admin = await createAdminUser();
			const patient1 = await createPatientUser();
			const patient2 = await createPatientUser();
			const therapist1 = await createTherapistUser();
			const therapist2 = await createTherapistUser();

			const profile1 = await createTherapistProfile(therapist1._id.toString(), {
				isVerified: true,
			});
			const profile2 = await createTherapistProfile(therapist2._id.toString(), {
				isVerified: false,
			});

			// Create sessions
			await createSession(patient1._id.toString(), therapist1._id.toString(), {
				status: 'completed',
			});
			await createSession(patient2._id.toString(), therapist2._id.toString(), {
				status: 'completed',
			});

			// Create payments/revenue
			await createPayment(patient1._id.toString(), { amount: 1000 });
			await createPayment(patient2._id.toString(), { amount: 2000 });

			// Create subscriptions
			await createSubscription(patient1._id.toString(), { status: 'active' });
			await createSubscription(patient2._id.toString(), { status: 'expired' });

			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/metrics`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty('totalUsers');
			expect(response.body.data).toHaveProperty('totalTherapists');
			expect(response.body.data).toHaveProperty('verifiedTherapists');
			expect(response.body.data).toHaveProperty('completedSessions');
			expect(response.body.data).toHaveProperty('totalRevenue');
			expect(response.body.data).toHaveProperty('activeSubscriptions');

			// Validate numeric values
			expect(typeof response.body.data.totalUsers).toBe('number');
			expect(typeof response.body.data.totalTherapists).toBe('number');
			expect(typeof response.body.data.verifiedTherapists).toBe('number');
			expect(typeof response.body.data.completedSessions).toBe('number');
			expect(typeof response.body.data.totalRevenue).toBe('number');
			expect(typeof response.body.data.activeSubscriptions).toBe('number');

			// Validate counts based on setup
			expect(response.body.data.totalTherapists).toBe(2);
			expect(response.body.data.verifiedTherapists).toBe(1);
			expect(response.body.data.completedSessions).toBe(2);
			expect(response.body.data.totalRevenue).toBe(3000);
			expect(response.body.data.activeSubscriptions).toBe(1);
		});

		it('✗ Non-admin cannot access metrics', async () => {
			// Arrange
			const patient = await createPatientUser();
			const token = generatePatientToken(patient._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/metrics`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✓ Metrics endpoint works with empty database', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/metrics`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data.totalUsers).toBeGreaterThanOrEqual(0);
			expect(response.body.data.totalTherapists).toBe(0);
			expect(response.body.data.completedSessions).toBe(0);
			expect(response.body.data.totalRevenue).toBe(0);
		});
	});

	describe('GET /admin/subscriptions - List Subscriptions', () => {
		it('✓ Admin can fetch paginated subscriptions', async () => {
			// Arrange
			const admin = await createAdminUser();
			const patient1 = await createPatientUser();
			const patient2 = await createPatientUser();

			await createSubscription(patient1._id.toString(), {
				planType: 'basic',
				status: 'active',
			});
			await createSubscription(patient2._id.toString(), {
				planType: 'premium',
				status: 'active',
			});

			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/subscriptions`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty('subscriptions');
			expect(response.body.data).toHaveProperty('pagination');
			expect(Array.isArray(response.body.data.subscriptions)).toBe(true);
			expect(response.body.data.subscriptions.length).toBeGreaterThanOrEqual(2);
		});

		it('✓ Subscriptions endpoint respects pagination limits', async () => {
			// Arrange
			const admin = await createAdminUser();

			// Create 15 subscriptions
			for (let i = 0; i < 15; i++) {
				const patient = await createPatientUser({ email: `patient${i}@test.com` });
				await createSubscription(patient._id.toString());
			}

			const token = generateAdminToken(admin._id.toString());

			// Act - Page 1 with limit 10
			const response1 = await request(app)
				.get(`${API_BASE_PATH}/subscriptions`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 10 });

			// Act - Page 2 with limit 10
			const response2 = await request(app)
				.get(`${API_BASE_PATH}/subscriptions`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 2, limit: 10 });

			// Assert
			expect(response1.status).toBe(200);
			expect(response1.body.data.subscriptions.length).toBe(10);
			expect(response1.body.data.pagination).toHaveProperty('page', 1);
			expect(response1.body.data.pagination).toHaveProperty('limit', 10);
			expect(response1.body.data.pagination).toHaveProperty('total');

			expect(response2.status).toBe(200);
			expect(response2.body.data.subscriptions.length).toBeLessThanOrEqual(5);
			expect(response2.body.data.pagination).toHaveProperty('page', 2);
		});

		it('✓ Can filter subscriptions by plan type', async () => {
			// Arrange
			const admin = await createAdminUser();
			const patient1 = await createPatientUser();
			const patient2 = await createPatientUser();
			const patient3 = await createPatientUser();

			await createSubscription(patient1._id.toString(), { planType: 'basic' });
			await createSubscription(patient2._id.toString(), { planType: 'premium' });
			await createSubscription(patient3._id.toString(), { planType: 'pro' });

			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/subscriptions`)
				.set('Authorization', `Bearer ${token}`)
				.query({ planType: 'premium', page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data.subscriptions).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ planType: 'premium' })
				])
			);
		});

		it('✓ Can filter subscriptions by status', async () => {
			// Arrange
			const admin = await createAdminUser();
			const patient1 = await createPatientUser();
			const patient2 = await createPatientUser();

			await createSubscription(patient1._id.toString(), { status: 'active' });
			await createSubscription(patient2._id.toString(), { status: 'cancelled' });

			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/subscriptions`)
				.set('Authorization', `Bearer ${token}`)
				.query({ status: 'active', page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(200);
			expect(Array.isArray(response.body.data.subscriptions)).toBe(true);
			response.body.data.subscriptions.forEach((sub: any) => {
				expect(sub.status).toBe('active');
			});
		});

		it('✗ Non-admin cannot fetch subscriptions', async () => {
			// Arrange
			const patient = await createPatientUser();
			const token = generatePatientToken(patient._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/subscriptions`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 10 });

			// Assert
			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✓ Respects maximum limit of 50 items per page', async () => {
			// Arrange
			const admin = await createAdminUser();

			// Create 60 subscriptions
			for (let i = 0; i < 60; i++) {
				const patient = await createPatientUser({ email: `patient${i}@test.com` });
				await createSubscription(patient._id.toString());
			}

			const token = generateAdminToken(admin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/subscriptions`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 100 }); // Request 100, should be capped at 50

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data.subscriptions.length).toBeLessThanOrEqual(50);
		});
	});

	describe('Error Handling & Edge Cases', () => {
		it('✗ Deleted admin account returns 410', async () => {
			// Arrange
			const deletedAdmin = await createAdminUser({ isDeleted: true });
			const token = generateAdminToken(deletedAdmin._id.toString());

			// Act
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${token}`);

			// Assert
			expect(response.status).toBe(410);
			expect(response.body).toHaveProperty('success', false);
		});

		it('✗ Missing authorization header returns 401', async () => {
			// Act
			const response = await request(app).get(`${API_BASE_PATH}/users`);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body.error).toMatch(/auth|token|required/i);
		});

		it('✓ Invalid query parameters are handled gracefully', async () => {
			// Arrange
			const admin = await createAdminUser();
			const token = generateAdminToken(admin._id.toString());

			// Act - Send invalid page number
			const response = await request(app)
				.get(`${API_BASE_PATH}/users`)
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 'invalid', limit: 'not-a-number' });

			// Assert
			expect([200, 400]).toContain(response.status);
			if (response.status === 400) {
				expect(response.body).toHaveProperty('success', false);
			}
		});
	});
});
