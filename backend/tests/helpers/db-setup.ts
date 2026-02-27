import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import UserModel from '../../src/models/user.model';
import TherapistProfileModel from '../../src/models/therapist.model';
import SubscriptionModel from '../../src/models/subscription.model';
import SessionModel from '../../src/models/session.model';

let mongoServer: MongoMemoryServer;

export const connectToTestDB = async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();
	await mongoose.connect(mongoUri);
};

export const disconnectFromTestDB = async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
};

export const clearTestDB = async () => {
	const collections = mongoose.connection.collections;
	for (const key in collections) {
		const collection = collections[key];
		await collection.deleteMany({});
	}
};

/**
 * Create a test admin user
 */
export const createAdminUser = async (overrides = {}) => {
	const adminData = {
		email: 'admin@test.com',
		password: 'hashed-password',
		firstName: 'Admin',
		lastName: 'User',
		role: 'admin',
		isEmailVerified: true,
		isDeleted: false,
		...overrides,
	};
	const admin = await UserModel.create(adminData);
	return admin;
};

/**
 * Create a test patient user
 */
export const createPatientUser = async (overrides = {}) => {
	const patientData = {
		email: `patient-${Date.now()}@test.com`,
		password: 'hashed-password',
		firstName: 'Patient',
		lastName: 'User',
		role: 'patient',
		isEmailVerified: true,
		isDeleted: false,
		...overrides,
	};
	const patient = await UserModel.create(patientData);
	return patient;
};

/**
 * Create a test therapist user with profile
 */
export const createTherapistUser = async (overrides = {}) => {
	const therapistUserData = {
		email: `therapist-${Date.now()}@test.com`,
		password: 'hashed-password',
		firstName: 'Therapist',
		lastName: 'User',
		role: 'therapist',
		isEmailVerified: true,
		isDeleted: false,
		...overrides,
	};
	const therapist = await UserModel.create(therapistUserData);
	return therapist;
};

/**
 * Create a test therapist profile
 */
export const createTherapistProfile = async (userId: string, overrides = {}) => {
	const profileData = {
		userId,
		licenseNumber: `LIC-${Date.now()}`,
		specializations: ['anxiety', 'depression'],
		yearsOfExperience: 5,
		isVerified: false,
		bio: 'Test therapist',
		...overrides,
	};
	const profile = await TherapistProfileModel.create(profileData);
	return profile;
};

/**
 * Create a test subscription
 */
export const createSubscription = async (userId: string, overrides = {}) => {
	const subscriptionData = {
		userId,
		planType: 'basic',
		status: 'active',
		startDate: new Date(),
		endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		autoRenew: true,
		...overrides,
	};
	const subscription = await SubscriptionModel.create(subscriptionData);
	return subscription;
};

/**
 * Create a test session
 */
export const createSession = async (patientId: string, therapistId: string, overrides = {}) => {
	const sessionData = {
		patientId,
		therapistId,
		startTime: new Date(),
		endTime: new Date(Date.now() + 60 * 60 * 1000),
		status: 'completed',
		duration: 60,
		notes: 'Test session',
		...overrides,
	};
	const session = await SessionModel.create(sessionData);
	return session;
};

/**
 * Create a test payment
 */
export const createPayment = async (userId: string, overrides = {}) => {
	// Payment model is empty/not implemented
	// Return a mock payment object for testing
	const paymentData = {
		_id: new mongoose.Types.ObjectId(),
		userId,
		amount: 100,
		currency: 'INR',
		status: 'completed',
		paymentMethod: 'credit_card',
		transactionId: `TXN-${Date.now()}`,
		...overrides,
	};
	return paymentData as any;
};
