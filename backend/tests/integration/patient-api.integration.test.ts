import request from 'supertest';
import { Types } from 'mongoose';

jest.mock('../../src/services/notification.service', () => ({
	publishPlaceholderNotificationEvent: jest.fn().mockResolvedValue({
		eventType: 'SESSION_BOOKING_CREATED',
		entityType: 'therapy_session',
		entityId: 'mock-entity-id',
		payload: {},
		occurredAt: new Date().toISOString(),
	}),
}));

import app from '../../src/app';
import { createAccessToken } from '../../src/utils/jwt';
import UserModel from '../../src/models/user.model';
import PatientProfileModel, { PatientMoodEntryModel } from '../../src/models/patient.model';
import TherapistProfileModel from '../../src/models/therapist.model';
import { TherapySessionModel } from '../../src/models/therapy-session.model';
import {
	startMongoMemory,
	clearMongoCollections,
	stopMongoMemory,
} from '../helpers/mongo-memory';

const buildAuthHeader = (userId: string, sessionId = String(new Types.ObjectId())): string => {
	const token = createAccessToken({
		sub: userId,
		sessionId,
		jti: `jti-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	});

	return `Bearer ${token}`;
};

const buildFutureSessionDate = (): Date => {
	const date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
	date.setSeconds(0, 0);
	return date;
};

describe('Patient API Integration', () => {
	let patientUserId: string;
	let patientAuthHeader: string;
	let therapistId: string;
	let bookingDate: Date;

	beforeAll(async () => {
		await startMongoMemory();
	});

	afterEach(async () => {
		await clearMongoCollections();
	});

	afterAll(async () => {
		await stopMongoMemory();
	});

	beforeEach(async () => {
		const patientUser = await UserModel.create({
			email: `patient-${Date.now()}@example.com`,
			role: 'patient',
			name: 'Patient One',
		});

		patientUserId = String(patientUser._id);
		patientAuthHeader = buildAuthHeader(patientUserId);

		bookingDate = buildFutureSessionDate();
		const minuteOfDay = bookingDate.getHours() * 60 + bookingDate.getMinutes();
		const startMinute = Math.max(0, minuteOfDay - 30);
		const endMinute = Math.min(1440, minuteOfDay + 30);

		const therapistUserOne = await UserModel.create({
			email: `therapist-1-${Date.now()}@example.com`,
			role: 'therapist',
			name: 'Therapist One User',
		});
		const therapistUserTwo = await UserModel.create({
			email: `therapist-2-${Date.now()}@example.com`,
			role: 'therapist',
			name: 'Therapist Two User',
		});

		const therapistOne = await TherapistProfileModel.create({
			userId: therapistUserOne._id,
			displayName: 'Dr. Priya Rao',
			specializations: ['anxiety', 'cbt', 'depression'],
			languages: ['english', 'hindi'],
			availabilitySlots: [
				{
					dayOfWeek: bookingDate.getDay(),
					startMinute,
					endMinute,
					isAvailable: true,
				},
			],
			yearsOfExperience: 8,
			averageRating: 4.8,
			maxConcurrentPatients: 20,
			currentActivePatients: 8,
		});

		await TherapistProfileModel.create({
			userId: therapistUserTwo._id,
			displayName: 'Dr. Arjun Menon',
			specializations: ['stress_management'],
			languages: ['english'],
			availabilitySlots: [
				{
					dayOfWeek: bookingDate.getDay(),
					startMinute,
					endMinute,
					isAvailable: true,
				},
			],
			yearsOfExperience: 5,
			averageRating: 4.2,
			maxConcurrentPatients: 15,
			currentActivePatients: 10,
		});

		therapistId = String(therapistOne._id);
	});

	it('runs patient profile, assessments, mood, match, booking, and session history flow', async () => {
		const profileResponse = await request(app)
			.post('/api/v1/patients/profile')
			.set('Authorization', patientAuthHeader)
			.send({
				age: 29,
				gender: 'female',
				medicalHistory: 'Mild insomnia',
				emergencyContact: {
					name: 'Asha',
					relation: 'sister',
					phone: '+919999999999',
				},
			});

		expect(profileResponse.status).toBe(201);
		expect(profileResponse.body.success).toBe(true);
		const patientProfileId = profileResponse.body.data._id as string;

		const phqResponse = await request(app)
			.post('/api/v1/patients/me/assessments')
			.set('Authorization', patientAuthHeader)
			.send({
				type: 'PHQ-9',
				answers: [2, 2, 1, 1, 1, 1, 1, 0, 0],
			});

		expect(phqResponse.status).toBe(201);
		expect(phqResponse.body.data.type).toBe('PHQ-9');

		const gadResponse = await request(app)
			.post('/api/v1/patients/me/assessments')
			.set('Authorization', patientAuthHeader)
			.send({
				type: 'GAD-7',
				answers: [2, 1, 1, 1, 1, 0, 0],
			});

		expect(gadResponse.status).toBe(201);
		expect(gadResponse.body.data.type).toBe('GAD-7');

		const assessmentHistoryResponse = await request(app)
			.get('/api/v1/patients/me/assessments?page=1&limit=10')
			.set('Authorization', patientAuthHeader);

		expect(assessmentHistoryResponse.status).toBe(200);
		expect(assessmentHistoryResponse.body.data.items.length).toBe(2);
		expect(assessmentHistoryResponse.body.data.meta.totalItems).toBe(2);

		await PatientMoodEntryModel.create([
			{
				patientId: new Types.ObjectId(patientProfileId),
				moodScore: 4,
				note: 'Anxious day',
				date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
			},
			{
				patientId: new Types.ObjectId(patientProfileId),
				moodScore: 7,
				note: 'Better day',
				date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
			},
		]);

		const moodHistoryResponse = await request(app)
			.get('/api/v1/patients/me/mood-history')
			.set('Authorization', patientAuthHeader);

		expect(moodHistoryResponse.status).toBe(200);
		expect(moodHistoryResponse.body.data.items.length).toBe(2);
		expect(moodHistoryResponse.body.data.grouped).toBeDefined();
		expect(moodHistoryResponse.body.data.trend).toBeDefined();

		const therapistMatchesResponse = await request(app)
			.get('/api/v1/patients/me/therapist-matches?languagePreference=english&specializationPreference=cbt&nextHours=168')
			.set('Authorization', patientAuthHeader);

		expect(therapistMatchesResponse.status).toBe(200);
		expect(therapistMatchesResponse.body.data.matches.length).toBeGreaterThan(0);
		expect(therapistMatchesResponse.body.data.matches[0].therapist).toHaveProperty('displayName');
		expect(therapistMatchesResponse.body.data.matches[0].therapist).not.toHaveProperty('email');

		const bookingResponse = await request(app)
			.post('/api/v1/patients/me/sessions/book')
			.set('Authorization', patientAuthHeader)
			.send({
				therapistId,
				dateTime: bookingDate.toISOString(),
			});

		expect(bookingResponse.status).toBe(201);
		expect(bookingResponse.body.data.status).toBe('pending');
		expect(bookingResponse.body.data.bookingReferenceId).toMatch(/^BK-\d{8}-[A-F0-9]{8}$/);

		const sessionHistoryResponse = await request(app)
			.get('/api/v1/patients/me/sessions?status=pending&page=1&limit=10')
			.set('Authorization', patientAuthHeader);

		expect(sessionHistoryResponse.status).toBe(200);
		expect(sessionHistoryResponse.body.data.items.length).toBe(1);
		expect(sessionHistoryResponse.body.data.items[0].therapist.name).toBe('Dr. Priya Rao');
		expect(sessionHistoryResponse.body.data.items[0].therapist.specializations).toContain('cbt');
		expect(sessionHistoryResponse.body.data.meta.totalItems).toBe(1);

		const bookedSession = await TherapySessionModel.findOne({ bookingReferenceId: bookingResponse.body.data.bookingReferenceId }).lean();
		expect(bookedSession).not.toBeNull();
		expect(bookedSession?.status).toBe('pending');
	});

	it('blocks non-patient access to patient session history endpoint', async () => {
		const therapistUser = await UserModel.create({
			email: `non-patient-${Date.now()}@example.com`,
			role: 'therapist',
			name: 'Therapist Actor',
		});

		const therapistToken = buildAuthHeader(String(therapistUser._id));
		const response = await request(app)
			.get('/api/v1/patients/me/sessions')
			.set('Authorization', therapistToken);

		expect(response.status).toBe(403);
		expect(response.body.message).toBe('Patient role required');
	});

	it('prevents double booking for the same patient and slot', async () => {
		await request(app)
			.post('/api/v1/patients/profile')
			.set('Authorization', patientAuthHeader)
			.send({
				age: 35,
				gender: 'male',
				emergencyContact: {
					name: 'Rohit',
					relation: 'brother',
					phone: '+918888888888',
				},
			});

		const firstBooking = await request(app)
			.post('/api/v1/patients/me/sessions/book')
			.set('Authorization', patientAuthHeader)
			.send({
				therapistId,
				dateTime: bookingDate.toISOString(),
			});
		expect(firstBooking.status).toBe(201);

		const secondBooking = await request(app)
			.post('/api/v1/patients/me/sessions/book')
			.set('Authorization', patientAuthHeader)
			.send({
				therapistId,
				dateTime: bookingDate.toISOString(),
			});

		expect(secondBooking.status).toBe(409);
		expect(secondBooking.body.details.conflictType).toBe('therapist_slot_unavailable');
	});
});
