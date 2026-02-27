import { randomBytes } from 'crypto';
import { AppError } from '../middleware/error.middleware';
import PatientProfileModel from '../models/patient.model';
import TherapistProfileModel from '../models/therapist.model';
import TherapySessionModel from '../models/therapy-session.model';
import { publishPlaceholderNotificationEvent } from './notification.service';
import { buildPaginationMeta, normalizePagination } from '../utils/pagination';
import UserModel from '../models/user.model';
import { decryptSessionNote, encryptSessionNote } from '../utils/encryption';
import { Types } from 'mongoose';

interface BookSessionInput {
	therapistId: string;
	dateTime: Date;
}

interface SessionHistoryQuery {
	status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	page: number;
	limit: number;
}

interface TherapistSessionHistoryQuery {
	status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	page: number;
	limit: number;
}

interface TherapistSessionStatusPayload {
	status: 'confirmed' | 'cancelled' | 'completed';
}

interface TherapistSessionNotePayload {
	content: string;
}

interface TherapistEarningsQuery {
	fromDate?: Date;
	toDate?: Date;
	page: number;
	limit: number;
}

const ACTIVE_STATUSES = ['pending', 'confirmed'] as const;

const buildBookingReferenceId = (): string => {
	const prefix = 'BK';
	const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const randomPart = randomBytes(4).toString('hex').toUpperCase();

	return `${prefix}-${datePart}-${randomPart}`;
};

const getSlotMinuteOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

const assertTherapistAvailability = (
	availabilitySlots: Array<{
		dayOfWeek: number;
		startMinute: number;
		endMinute: number;
		isAvailable: boolean;
	}>,
	sessionDateTime: Date,
): void => {
	const dayOfWeek = sessionDateTime.getDay();
	const minuteOfDay = getSlotMinuteOfDay(sessionDateTime);

	const isAvailable = availabilitySlots.some(
		(slot) =>
			slot.isAvailable &&
			slot.dayOfWeek === dayOfWeek &&
			minuteOfDay >= slot.startMinute &&
			minuteOfDay < slot.endMinute,
	);

	if (!isAvailable) {
		throw new AppError('Therapist is not available at the requested dateTime', 409);
	}
};

export const bookPatientSession = async (userId: string, input: BookSessionInput) => {
	const patientProfile = await PatientProfileModel.findOne({ userId }).select('_id').lean();
	if (!patientProfile) {
		throw new AppError('Patient profile not found. Please create profile first.', 404);
	}

	const therapist = await TherapistProfileModel.findById(input.therapistId)
		.select({
			_id: 1,
			displayName: 1,
			availabilitySlots: 1,
		})
		.lean();

	if (!therapist) {
		throw new AppError('Therapist not found', 404);
	}

	const now = new Date();
	if (input.dateTime <= now) {
		throw new AppError('dateTime must be in the future', 422);
	}

	assertTherapistAvailability(therapist.availabilitySlots ?? [], input.dateTime);

	const [therapistConflict, patientConflict] = await Promise.all([
		TherapySessionModel.findOne({
			therapistId: therapist._id,
			dateTime: input.dateTime,
			status: { $in: ACTIVE_STATUSES },
		})
			.select('_id bookingReferenceId status')
			.lean(),
		TherapySessionModel.findOne({
			patientId: patientProfile._id,
			dateTime: input.dateTime,
			status: { $in: ACTIVE_STATUSES },
		})
			.select('_id bookingReferenceId status')
			.lean(),
	]);

	if (therapistConflict) {
		throw new AppError('Requested slot already booked for therapist', 409, {
			conflictType: 'therapist_slot_unavailable',
		});
	}

	if (patientConflict) {
		throw new AppError('You already have a booking for this dateTime', 409, {
			conflictType: 'patient_double_booking',
		});
	}

	const bookingReferenceId = buildBookingReferenceId();

	const session = await TherapySessionModel.create({
		bookingReferenceId,
		patientId: patientProfile._id,
		therapistId: therapist._id,
		dateTime: input.dateTime,
		status: 'pending',
	});

	await publishPlaceholderNotificationEvent({
		eventType: 'SESSION_BOOKING_CREATED',
		entityType: 'therapy_session',
		entityId: String(session._id),
		payload: {
			bookingReferenceId,
			patientId: String(patientProfile._id),
			therapistId: String(therapist._id),
			dateTime: input.dateTime.toISOString(),
			status: 'pending',
		},
	});

	return {
		sessionId: String(session._id),
		bookingReferenceId,
		status: session.status,
		dateTime: session.dateTime,
		therapist: {
			id: String(therapist._id),
			displayName: therapist.displayName,
		},
	};
};

export const getMySessionHistory = async (userId: string, query: SessionHistoryQuery) => {
	const patientProfile = await PatientProfileModel.findOne({ userId }).select('_id').lean();
	if (!patientProfile) {
		throw new AppError('Patient profile not found. Please create profile first.', 404);
	}

	const pagination = normalizePagination(
		{ page: query.page, limit: query.limit },
		{ defaultPage: 1, defaultLimit: 10, maxLimit: 50 },
	);

	const filter: {
		patientId: typeof patientProfile._id;
		status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	} = {
		patientId: patientProfile._id,
	};

	if (query.status) {
		filter.status = query.status;
	}

	const now = new Date();

	const [totalItems, sessions, pastCount, upcomingCount] = await Promise.all([
		TherapySessionModel.countDocuments(filter),
		TherapySessionModel.find(filter)
			.select({
				_id: 1,
				bookingReferenceId: 1,
				therapistId: 1,
				dateTime: 1,
				status: 1,
				createdAt: 1,
			})
			.sort({ dateTime: -1 })
			.skip(pagination.skip)
			.limit(pagination.limit)
			.lean(),
		TherapySessionModel.countDocuments({
			...filter,
			dateTime: { $lt: now },
		}),
		TherapySessionModel.countDocuments({
			...filter,
			dateTime: { $gte: now },
		}),
	]);

	const therapistIds = [...new Set(sessions.map((session) => String(session.therapistId)))];

	const therapistProfiles = await TherapistProfileModel.find({
		_id: { $in: therapistIds },
	})
		.select({ _id: 1, displayName: 1, specializations: 1 })
		.lean();

	const therapistMap = new Map(
		therapistProfiles.map((therapist) => [String(therapist._id), therapist]),
	);

	const items = sessions.map((session) => {
		const therapist = therapistMap.get(String(session.therapistId));
		const sessionDate = new Date(session.dateTime);

		return {
			sessionId: String(session._id),
			bookingReferenceId: session.bookingReferenceId,
			dateTime: sessionDate,
			status: session.status,
			timing: sessionDate < now ? 'past' : 'upcoming',
			therapist: {
				id: String(session.therapistId),
				name: therapist?.displayName ?? 'Unknown Therapist',
				specializations: therapist?.specializations ?? [],
			},
			bookedAt: session.createdAt,
		};
	});

	return {
		items,
		summary: {
			pastCount,
			upcomingCount,
			totalCount: totalItems,
		},
		meta: buildPaginationMeta(totalItems, pagination),
	};
};

const assertTherapistUser = async (userId: string): Promise<void> => {
	const user = await UserModel.findById(userId).select('_id role isDeleted').lean();

	if (!user) {
		throw new AppError('User not found', 404);
	}

	if (user.isDeleted) {
		throw new AppError('User account is deleted', 410);
	}

	if (user.role !== 'therapist') {
		throw new AppError('Therapist role required', 403);
	}
};

export const getMyTherapistSessions = async (userId: string, query: TherapistSessionHistoryQuery) => {
	await assertTherapistUser(userId);

	const therapistProfile = await TherapistProfileModel.findOne({ userId }).select('_id').lean();
	if (!therapistProfile) {
		throw new AppError('Therapist profile not found. Please create profile first.', 404);
	}

	const pagination = normalizePagination(
		{ page: query.page, limit: query.limit },
		{ defaultPage: 1, defaultLimit: 10, maxLimit: 50 },
	);

	const filter: {
		therapistId: typeof therapistProfile._id;
		status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	} = {
		therapistId: therapistProfile._id,
	};

	if (query.status) {
		filter.status = query.status;
	}

	const now = new Date();

	const [totalItems, sessions, pastCount, upcomingCount] = await Promise.all([
		TherapySessionModel.countDocuments(filter),
		TherapySessionModel.find(filter)
			.select({
				_id: 1,
				bookingReferenceId: 1,
				patientId: 1,
				dateTime: 1,
				status: 1,
				createdAt: 1,
			})
			.sort({ dateTime: -1 })
			.skip(pagination.skip)
			.limit(pagination.limit)
			.lean(),
		TherapySessionModel.countDocuments({
			...filter,
			dateTime: { $lt: now },
		}),
		TherapySessionModel.countDocuments({
			...filter,
			dateTime: { $gte: now },
		}),
	]);

	const patientIds = [...new Set(sessions.map((session) => String(session.patientId)))];
	const patientProfiles = await PatientProfileModel.find({ _id: { $in: patientIds } })
		.select({ _id: 1, age: 1, gender: 1 })
		.lean();

	const patientMap = new Map(patientProfiles.map((patient) => [String(patient._id), patient]));

	const items = sessions.map((session) => {
		const patient = patientMap.get(String(session.patientId));
		const sessionDate = new Date(session.dateTime);

		return {
			sessionId: String(session._id),
			bookingReferenceId: session.bookingReferenceId,
			dateTime: sessionDate,
			status: session.status,
			timing: sessionDate < now ? 'past' : 'upcoming',
			patient: {
				id: String(session.patientId),
				age: patient?.age ?? null,
				gender: patient?.gender ?? null,
			},
			bookedAt: session.createdAt,
		};
	});

	return {
		items,
		summary: {
			pastCount,
			upcomingCount,
			totalCount: totalItems,
		},
		meta: buildPaginationMeta(totalItems, pagination),
	};
};

export const updateMyTherapistSessionStatus = async (
	userId: string,
	sessionId: string,
	payload: TherapistSessionStatusPayload,
) => {
	await assertTherapistUser(userId);

	const therapistProfile = await TherapistProfileModel.findOne({ userId }).select('_id').lean();
	if (!therapistProfile) {
		throw new AppError('Therapist profile not found. Please create profile first.', 404);
	}

	const session = await TherapySessionModel.findOne({
		_id: sessionId,
		therapistId: therapistProfile._id,
	})
		.select({ _id: 1, bookingReferenceId: 1, patientId: 1, dateTime: 1, status: 1, cancelledAt: 1, updatedAt: 1 })
		.lean();

	if (!session) {
		throw new AppError('Session not found', 404);
	}

	if (session.status === payload.status) {
		return {
			sessionId: String(session._id),
			bookingReferenceId: session.bookingReferenceId,
			status: session.status,
			dateTime: session.dateTime,
			updatedAt: session.updatedAt,
		};
	}

	if (session.status === 'cancelled' || session.status === 'completed') {
		throw new AppError('Session status cannot be updated once cancelled or completed', 409, {
			conflictType: 'session_status_finalized',
		});
	}

	if (payload.status === 'confirmed' && session.status !== 'pending') {
		throw new AppError('Only pending sessions can be confirmed', 409, {
			conflictType: 'invalid_status_transition',
		});
	}

	if (payload.status === 'completed' && session.status !== 'confirmed') {
		throw new AppError('Only confirmed sessions can be completed', 409, {
			conflictType: 'invalid_status_transition',
		});
	}

	const updated = await TherapySessionModel.findOneAndUpdate(
		{ _id: sessionId, therapistId: therapistProfile._id },
		{
			$set: {
				status: payload.status,
				cancelledAt: payload.status === 'cancelled' ? new Date() : null,
			},
		},
		{ new: true },
	)
		.select({ _id: 1, bookingReferenceId: 1, patientId: 1, dateTime: 1, status: 1, cancelledAt: 1, updatedAt: 1 })
		.lean();

	if (!updated) {
		throw new AppError('Session not found', 404);
	}

	return {
		sessionId: String(updated._id),
		bookingReferenceId: updated.bookingReferenceId,
		status: updated.status,
		dateTime: updated.dateTime,
		cancelledAt: updated.cancelledAt,
		updatedAt: updated.updatedAt,
	};
};

export const saveMyTherapistSessionNote = async (
	userId: string,
	sessionId: string,
	payload: TherapistSessionNotePayload,
) => {
	await assertTherapistUser(userId);

	const therapistProfile = await TherapistProfileModel.findOne({ userId }).select('_id').lean();
	if (!therapistProfile) {
		throw new AppError('Therapist profile not found. Please create profile first.', 404);
	}

	const encrypted = encryptSessionNote(payload.content);
	const noteUpdatedAt = new Date();

	const updated = await TherapySessionModel.findOneAndUpdate(
		{ _id: sessionId, therapistId: therapistProfile._id },
		{
			$set: {
				note: {
					encryptedContent: encrypted.encryptedContent,
					iv: encrypted.iv,
					authTag: encrypted.authTag,
					updatedAt: noteUpdatedAt,
					updatedByTherapistId: therapistProfile._id,
				},
			},
		},
		{ new: true },
	)
		.select({ _id: 1, bookingReferenceId: 1, dateTime: 1, note: 1, updatedAt: 1 })
		.lean();

	if (!updated) {
		throw new AppError('Session not found', 404);
	}

	return {
		sessionId: String(updated._id),
		bookingReferenceId: updated.bookingReferenceId,
		note: {
			encryptedContent: updated.note?.encryptedContent ?? null,
			iv: updated.note?.iv ?? null,
			authTag: updated.note?.authTag ?? null,
			updatedAt: updated.note?.updatedAt ?? null,
		},
		updatedAt: updated.updatedAt,
	};
};

export const getMyTherapistSessionNoteDecrypted = async (
	userId: string,
	sessionId: string,
): Promise<string> => {
	await assertTherapistUser(userId);

	const therapistProfile = await TherapistProfileModel.findOne({ userId }).select('_id').lean();
	if (!therapistProfile) {
		throw new AppError('Therapist profile not found. Please create profile first.', 404);
	}

	const session = await TherapySessionModel.findOne({ _id: sessionId, therapistId: therapistProfile._id })
		.select({ note: 1 })
		.lean();

	if (!session) {
		throw new AppError('Session not found', 404);
	}

	if (!session.note?.encryptedContent || !session.note?.iv || !session.note?.authTag) {
		throw new AppError('Session note not found', 404);
	}

	return decryptSessionNote({
		encryptedContent: session.note.encryptedContent,
		iv: session.note.iv,
		authTag: session.note.authTag,
	});
};

export const getMyTherapistEarnings = async (userId: string, query: TherapistEarningsQuery) => {
	await assertTherapistUser(userId);

	const therapistProfile = await TherapistProfileModel.findOne({ userId })
		.select({ _id: 1, consultationFee: 1, currency: 1 })
		.lean();

	if (!therapistProfile) {
		throw new AppError('Therapist profile not found. Please create profile first.', 404);
	}

	const pagination = normalizePagination(
		{ page: query.page, limit: query.limit },
		{ defaultPage: 1, defaultLimit: 10, maxLimit: 50 },
	);

	const earningsPerSession = therapistProfile.consultationFee ?? 0;

	const dateMatch: { $gte?: Date; $lte?: Date } = {};
	if (query.fromDate) {
		dateMatch.$gte = query.fromDate;
	}
	if (query.toDate) {
		dateMatch.$lte = query.toDate;
	}

	const baseMatch: {
		therapistId: Types.ObjectId;
		status: 'completed';
		dateTime?: { $gte?: Date; $lte?: Date };
	} = {
		therapistId: therapistProfile._id,
		status: 'completed',
	};

	if (query.fromDate || query.toDate) {
		baseMatch.dateTime = dateMatch;
	}

	const currentMonthStart = new Date();
	currentMonthStart.setDate(1);
	currentMonthStart.setHours(0, 0, 0, 0);

	const nextMonthStart = new Date(currentMonthStart);
	nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

	const [summaryResult, monthlyCountResult] = await Promise.all([
		TherapySessionModel.aggregate<{
			totalCompletedSessions: number;
			totalEarnings: number;
			history: Array<{
				_id: Types.ObjectId;
				bookingReferenceId: string;
				patientId: Types.ObjectId;
				dateTime: Date;
				status: 'completed';
				updatedAt: Date;
			}>;
		}>([
			{ $match: baseMatch },
			{
				$facet: {
					summary: [
						{
							$group: {
								_id: null,
								totalCompletedSessions: { $sum: 1 },
							},
						},
					],
					history: [
						{ $sort: { dateTime: -1 } },
						{ $skip: pagination.skip },
						{ $limit: pagination.limit },
						{
							$project: {
								_id: 1,
								bookingReferenceId: 1,
								patientId: 1,
								dateTime: 1,
								status: 1,
								updatedAt: 1,
							},
						},
					],
				},
			},
			{
				$project: {
					totalCompletedSessions: {
						$ifNull: [{ $arrayElemAt: ['$summary.totalCompletedSessions', 0] }, 0],
					},
					totalEarnings: {
						$multiply: [{ $ifNull: [{ $arrayElemAt: ['$summary.totalCompletedSessions', 0] }, 0] }, earningsPerSession],
					},
					history: '$history',
				},
			},
		]),
		TherapySessionModel.countDocuments({
			therapistId: therapistProfile._id,
			status: 'completed',
			dateTime: {
				$gte: currentMonthStart,
				$lt: nextMonthStart,
			},
		}),
	]);

	const aggregated = summaryResult[0] ?? {
		totalCompletedSessions: 0,
		totalEarnings: 0,
		history: [],
	};

	const historyPatientIds = [...new Set((aggregated.history ?? []).map((item) => String(item.patientId)))];
	const patientProfiles = await PatientProfileModel.find({
		_id: { $in: historyPatientIds },
	})
		.select({ _id: 1, age: 1, gender: 1 })
		.lean();

	const patientMap = new Map(patientProfiles.map((patient) => [String(patient._id), patient]));

	const historyItems = (aggregated.history ?? []).map((item) => {
		const patient = patientMap.get(String(item.patientId));

		return {
			sessionId: String(item._id),
			bookingReferenceId: item.bookingReferenceId,
			dateTime: item.dateTime,
			earningAmount: earningsPerSession,
			status: item.status,
			patient: {
				id: String(item.patientId),
				age: patient?.age ?? null,
				gender: patient?.gender ?? null,
			},
			completedAt: item.updatedAt,
		};
	});

	return {
		summary: {
			totalEarnings: aggregated.totalEarnings,
			monthlyEarnings: monthlyCountResult * earningsPerSession,
			completedSessionCount: aggregated.totalCompletedSessions,
			currency: 'INR',
		},
		filters: {
			fromDate: query.fromDate ?? null,
			toDate: query.toDate ?? null,
		},
		history: {
			items: historyItems,
			meta: buildPaginationMeta(aggregated.totalCompletedSessions, pagination),
		},
	};
};
