"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTherapistEarnings = exports.getMyTherapistSessionNoteDecrypted = exports.saveMyTherapistSessionNote = exports.updateMyTherapistSessionStatus = exports.getMyTherapistSessions = exports.getMySessionHistory = exports.bookPatientSession = void 0;
const crypto_1 = require("crypto");
const error_middleware_1 = require("../middleware/error.middleware");
const patient_model_1 = __importDefault(require("../models/patient.model"));
const therapist_model_1 = __importDefault(require("../models/therapist.model"));
const therapy_session_model_1 = __importDefault(require("../models/therapy-session.model"));
const notification_service_1 = require("./notification.service");
const pagination_1 = require("../utils/pagination");
const user_model_1 = __importDefault(require("../models/user.model"));
const encryption_1 = require("../utils/encryption");
const ACTIVE_STATUSES = ['pending', 'confirmed'];
const buildBookingReferenceId = () => {
    const prefix = 'BK';
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = (0, crypto_1.randomBytes)(4).toString('hex').toUpperCase();
    return `${prefix}-${datePart}-${randomPart}`;
};
const getSlotMinuteOfDay = (date) => date.getHours() * 60 + date.getMinutes();
const assertTherapistAvailability = (availabilitySlots, sessionDateTime) => {
    const dayOfWeek = sessionDateTime.getDay();
    const minuteOfDay = getSlotMinuteOfDay(sessionDateTime);
    const isAvailable = availabilitySlots.some((slot) => slot.isAvailable &&
        slot.dayOfWeek === dayOfWeek &&
        minuteOfDay >= slot.startMinute &&
        minuteOfDay < slot.endMinute);
    if (!isAvailable) {
        throw new error_middleware_1.AppError('Therapist is not available at the requested dateTime', 409);
    }
};
const bookPatientSession = async (userId, input) => {
    const patientProfile = await patient_model_1.default.findOne({ userId }).select('_id').lean();
    if (!patientProfile) {
        throw new error_middleware_1.AppError('Patient profile not found. Please create profile first.', 404);
    }
    const therapist = await therapist_model_1.default.findById(input.therapistId)
        .select({
        _id: 1,
        displayName: 1,
        availabilitySlots: 1,
    })
        .lean();
    if (!therapist) {
        throw new error_middleware_1.AppError('Therapist not found', 404);
    }
    const now = new Date();
    if (input.dateTime <= now) {
        throw new error_middleware_1.AppError('dateTime must be in the future', 422);
    }
    assertTherapistAvailability(therapist.availabilitySlots ?? [], input.dateTime);
    const [therapistConflict, patientConflict] = await Promise.all([
        therapy_session_model_1.default.findOne({
            therapistId: therapist._id,
            dateTime: input.dateTime,
            status: { $in: ACTIVE_STATUSES },
        })
            .select('_id bookingReferenceId status')
            .lean(),
        therapy_session_model_1.default.findOne({
            patientId: patientProfile._id,
            dateTime: input.dateTime,
            status: { $in: ACTIVE_STATUSES },
        })
            .select('_id bookingReferenceId status')
            .lean(),
    ]);
    if (therapistConflict) {
        throw new error_middleware_1.AppError('Requested slot already booked for therapist', 409, {
            conflictType: 'therapist_slot_unavailable',
        });
    }
    if (patientConflict) {
        throw new error_middleware_1.AppError('You already have a booking for this dateTime', 409, {
            conflictType: 'patient_double_booking',
        });
    }
    const bookingReferenceId = buildBookingReferenceId();
    const session = await therapy_session_model_1.default.create({
        bookingReferenceId,
        patientId: patientProfile._id,
        therapistId: therapist._id,
        dateTime: input.dateTime,
        status: 'pending',
    });
    await (0, notification_service_1.publishPlaceholderNotificationEvent)({
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
exports.bookPatientSession = bookPatientSession;
const getMySessionHistory = async (userId, query) => {
    const patientProfile = await patient_model_1.default.findOne({ userId }).select('_id').lean();
    if (!patientProfile) {
        throw new error_middleware_1.AppError('Patient profile not found. Please create profile first.', 404);
    }
    const pagination = (0, pagination_1.normalizePagination)({ page: query.page, limit: query.limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    const filter = {
        patientId: patientProfile._id,
    };
    if (query.status) {
        filter.status = query.status;
    }
    const now = new Date();
    const [totalItems, sessions, pastCount, upcomingCount] = await Promise.all([
        therapy_session_model_1.default.countDocuments(filter),
        therapy_session_model_1.default.find(filter)
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
        therapy_session_model_1.default.countDocuments({
            ...filter,
            dateTime: { $lt: now },
        }),
        therapy_session_model_1.default.countDocuments({
            ...filter,
            dateTime: { $gte: now },
        }),
    ]);
    const therapistIds = [...new Set(sessions.map((session) => String(session.therapistId)))];
    const therapistProfiles = await therapist_model_1.default.find({
        _id: { $in: therapistIds },
    })
        .select({ _id: 1, displayName: 1, specializations: 1 })
        .lean();
    const therapistMap = new Map(therapistProfiles.map((therapist) => [String(therapist._id), therapist]));
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
        meta: (0, pagination_1.buildPaginationMeta)(totalItems, pagination),
    };
};
exports.getMySessionHistory = getMySessionHistory;
const assertTherapistUser = async (userId) => {
    const user = await user_model_1.default.findById(userId).select('_id role isDeleted').lean();
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    if (user.isDeleted) {
        throw new error_middleware_1.AppError('User account is deleted', 410);
    }
    if (user.role !== 'therapist') {
        throw new error_middleware_1.AppError('Therapist role required', 403);
    }
};
const getMyTherapistSessions = async (userId, query) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const pagination = (0, pagination_1.normalizePagination)({ page: query.page, limit: query.limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    const filter = {
        therapistId: therapistProfile._id,
    };
    if (query.status) {
        filter.status = query.status;
    }
    const now = new Date();
    const [totalItems, sessions, pastCount, upcomingCount] = await Promise.all([
        therapy_session_model_1.default.countDocuments(filter),
        therapy_session_model_1.default.find(filter)
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
        therapy_session_model_1.default.countDocuments({
            ...filter,
            dateTime: { $lt: now },
        }),
        therapy_session_model_1.default.countDocuments({
            ...filter,
            dateTime: { $gte: now },
        }),
    ]);
    const patientIds = [...new Set(sessions.map((session) => String(session.patientId)))];
    const patientProfiles = await patient_model_1.default.find({ _id: { $in: patientIds } })
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
        meta: (0, pagination_1.buildPaginationMeta)(totalItems, pagination),
    };
};
exports.getMyTherapistSessions = getMyTherapistSessions;
const updateMyTherapistSessionStatus = async (userId, sessionId, payload) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const session = await therapy_session_model_1.default.findOne({
        _id: sessionId,
        therapistId: therapistProfile._id,
    })
        .select({ _id: 1, bookingReferenceId: 1, patientId: 1, dateTime: 1, status: 1, cancelledAt: 1, updatedAt: 1 })
        .lean();
    if (!session) {
        throw new error_middleware_1.AppError('Session not found', 404);
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
        throw new error_middleware_1.AppError('Session status cannot be updated once cancelled or completed', 409, {
            conflictType: 'session_status_finalized',
        });
    }
    if (payload.status === 'confirmed' && session.status !== 'pending') {
        throw new error_middleware_1.AppError('Only pending sessions can be confirmed', 409, {
            conflictType: 'invalid_status_transition',
        });
    }
    if (payload.status === 'completed' && session.status !== 'confirmed') {
        throw new error_middleware_1.AppError('Only confirmed sessions can be completed', 409, {
            conflictType: 'invalid_status_transition',
        });
    }
    const updated = await therapy_session_model_1.default.findOneAndUpdate({ _id: sessionId, therapistId: therapistProfile._id }, {
        $set: {
            status: payload.status,
            cancelledAt: payload.status === 'cancelled' ? new Date() : null,
        },
    }, { new: true })
        .select({ _id: 1, bookingReferenceId: 1, patientId: 1, dateTime: 1, status: 1, cancelledAt: 1, updatedAt: 1 })
        .lean();
    if (!updated) {
        throw new error_middleware_1.AppError('Session not found', 404);
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
exports.updateMyTherapistSessionStatus = updateMyTherapistSessionStatus;
const saveMyTherapistSessionNote = async (userId, sessionId, payload) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const encrypted = (0, encryption_1.encryptSessionNote)(payload.content);
    const noteUpdatedAt = new Date();
    const updated = await therapy_session_model_1.default.findOneAndUpdate({ _id: sessionId, therapistId: therapistProfile._id }, {
        $set: {
            note: {
                encryptedContent: encrypted.encryptedContent,
                iv: encrypted.iv,
                authTag: encrypted.authTag,
                updatedAt: noteUpdatedAt,
                updatedByTherapistId: therapistProfile._id,
            },
        },
    }, { new: true })
        .select({ _id: 1, bookingReferenceId: 1, dateTime: 1, note: 1, updatedAt: 1 })
        .lean();
    if (!updated) {
        throw new error_middleware_1.AppError('Session not found', 404);
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
exports.saveMyTherapistSessionNote = saveMyTherapistSessionNote;
const getMyTherapistSessionNoteDecrypted = async (userId, sessionId) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const session = await therapy_session_model_1.default.findOne({ _id: sessionId, therapistId: therapistProfile._id })
        .select({ note: 1 })
        .lean();
    if (!session) {
        throw new error_middleware_1.AppError('Session not found', 404);
    }
    if (!session.note?.encryptedContent || !session.note?.iv || !session.note?.authTag) {
        throw new error_middleware_1.AppError('Session note not found', 404);
    }
    return (0, encryption_1.decryptSessionNote)({
        encryptedContent: session.note.encryptedContent,
        iv: session.note.iv,
        authTag: session.note.authTag,
    });
};
exports.getMyTherapistSessionNoteDecrypted = getMyTherapistSessionNoteDecrypted;
const getMyTherapistEarnings = async (userId, query) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId })
        .select({ _id: 1, consultationFee: 1, currency: 1 })
        .lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const pagination = (0, pagination_1.normalizePagination)({ page: query.page, limit: query.limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    const earningsPerSession = therapistProfile.consultationFee ?? 0;
    const dateMatch = {};
    if (query.fromDate) {
        dateMatch.$gte = query.fromDate;
    }
    if (query.toDate) {
        dateMatch.$lte = query.toDate;
    }
    const baseMatch = {
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
        therapy_session_model_1.default.aggregate([
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
        therapy_session_model_1.default.countDocuments({
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
    const patientProfiles = await patient_model_1.default.find({
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
            meta: (0, pagination_1.buildPaginationMeta)(aggregated.totalCompletedSessions, pagination),
        },
    };
};
exports.getMyTherapistEarnings = getMyTherapistEarnings;
