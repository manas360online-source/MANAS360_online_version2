"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTherapistMatches = exports.getMyMoodHistory = exports.getMyPatientAssessmentHistory = exports.createPatientAssessment = exports.getMyPatientProfile = exports.createPatientProfile = void 0;
const patient_model_1 = __importStar(require("../models/patient.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const error_middleware_1 = require("../middleware/error.middleware");
const pagination_1 = require("../utils/pagination");
const therapist_model_1 = __importDefault(require("../models/therapist.model"));
const safePatientProjection = {
    userId: 1,
    age: 1,
    gender: 1,
    medicalHistory: 1,
    emergencyContact: 1,
    createdAt: 1,
    updatedAt: 1,
};
const safeAssessmentProjection = {
    type: 1,
    answers: 1,
    totalScore: 1,
    severityLevel: 1,
    createdAt: 1,
};
const assertPatientUser = async (userId) => {
    const user = await user_model_1.default.findById(userId).select('_id role isDeleted').lean();
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    if (user.isDeleted) {
        throw new error_middleware_1.AppError('User account is deleted', 410);
    }
    if (user.role !== 'patient') {
        throw new error_middleware_1.AppError('Patient role required', 403);
    }
};
const createPatientProfile = async (userId, input) => {
    await assertPatientUser(userId);
    const existingProfile = await patient_model_1.default.findOne({ userId }).select('_id').lean();
    if (existingProfile) {
        throw new error_middleware_1.AppError('Patient profile already exists', 409);
    }
    const profile = await patient_model_1.default.create({
        userId,
        age: input.age,
        gender: input.gender,
        medicalHistory: input.medicalHistory,
        emergencyContact: input.emergencyContact,
    });
    return patient_model_1.default.findById(profile._id, safePatientProjection).lean();
};
exports.createPatientProfile = createPatientProfile;
const getMyPatientProfile = async (userId) => {
    await assertPatientUser(userId);
    const profile = await patient_model_1.default.findOne({ userId }, safePatientProjection).lean();
    if (!profile) {
        throw new error_middleware_1.AppError('Patient profile not found', 404);
    }
    return profile;
};
exports.getMyPatientProfile = getMyPatientProfile;
const calculateAssessmentScore = (type, answers) => {
    const expectedLength = type === 'PHQ-9' ? 9 : 7;
    if (answers.length !== expectedLength) {
        throw new error_middleware_1.AppError(`answers must contain exactly ${expectedLength} values for ${type}`, 422);
    }
    const totalScore = answers.reduce((sum, value) => sum + value, 0);
    if (type === 'PHQ-9') {
        if (totalScore <= 4) {
            return { totalScore, severityLevel: 'minimal' };
        }
        if (totalScore <= 9) {
            return { totalScore, severityLevel: 'mild' };
        }
        if (totalScore <= 14) {
            return { totalScore, severityLevel: 'moderate' };
        }
        if (totalScore <= 19) {
            return { totalScore, severityLevel: 'moderately_severe' };
        }
        return { totalScore, severityLevel: 'severe' };
    }
    if (totalScore <= 4) {
        return { totalScore, severityLevel: 'minimal' };
    }
    if (totalScore <= 9) {
        return { totalScore, severityLevel: 'mild' };
    }
    if (totalScore <= 14) {
        return { totalScore, severityLevel: 'moderate' };
    }
    return { totalScore, severityLevel: 'severe' };
};
const createPatientAssessment = async (userId, input) => {
    await assertPatientUser(userId);
    const patientProfile = await patient_model_1.default.findOne({ userId }).select('_id').lean();
    if (!patientProfile) {
        throw new error_middleware_1.AppError('Patient profile not found. Please create profile first.', 404);
    }
    const { totalScore, severityLevel } = calculateAssessmentScore(input.type, input.answers);
    const assessment = await patient_model_1.PatientAssessmentModel.create({
        patientId: patientProfile._id,
        type: input.type,
        answers: input.answers,
        totalScore,
        severityLevel,
    });
    return patient_model_1.PatientAssessmentModel.findById(assessment._id, safeAssessmentProjection).lean();
};
exports.createPatientAssessment = createPatientAssessment;
const getMyPatientAssessmentHistory = async (userId, query) => {
    await assertPatientUser(userId);
    const patientProfile = await patient_model_1.default.findOne({ userId }).select('_id').lean();
    if (!patientProfile) {
        throw new error_middleware_1.AppError('Patient profile not found. Please create profile first.', 404);
    }
    const pagination = (0, pagination_1.normalizePagination)({ page: query.page, limit: query.limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    const mongoFilter = {
        patientId: patientProfile._id,
    };
    if (query.type) {
        mongoFilter.type = query.type;
    }
    if (query.fromDate || query.toDate) {
        mongoFilter.createdAt = {
            ...(query.fromDate ? { $gte: query.fromDate } : {}),
            ...(query.toDate ? { $lte: query.toDate } : {}),
        };
    }
    const [totalItems, items] = await Promise.all([
        patient_model_1.PatientAssessmentModel.countDocuments(mongoFilter),
        patient_model_1.PatientAssessmentModel.find(mongoFilter, safeAssessmentProjection)
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit)
            .lean(),
    ]);
    return {
        items,
        meta: (0, pagination_1.buildPaginationMeta)(totalItems, pagination),
    };
};
exports.getMyPatientAssessmentHistory = getMyPatientAssessmentHistory;
const calculateMoodTrend = (entries) => {
    if (entries.length < 2) {
        return { trend: 'stable', delta: 0 };
    }
    const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
    const splitIndex = Math.floor(sorted.length / 2);
    const firstWindow = sorted.slice(0, splitIndex);
    const secondWindow = sorted.slice(splitIndex);
    if (firstWindow.length === 0 || secondWindow.length === 0) {
        return { trend: 'stable', delta: 0 };
    }
    const firstAvg = firstWindow.reduce((sum, entry) => sum + entry.moodScore, 0) / firstWindow.length;
    const secondAvg = secondWindow.reduce((sum, entry) => sum + entry.moodScore, 0) / secondWindow.length;
    const delta = Number((secondAvg - firstAvg).toFixed(2));
    if (delta >= 0.5) {
        return { trend: 'improving', delta };
    }
    if (delta <= -0.5) {
        return { trend: 'declining', delta };
    }
    return { trend: 'stable', delta };
};
const getMyMoodHistory = async (userId, query) => {
    await assertPatientUser(userId);
    const patientProfile = await patient_model_1.default.findOne({ userId }).select('_id').lean();
    if (!patientProfile) {
        throw new error_middleware_1.AppError('Patient profile not found. Please create profile first.', 404);
    }
    const matchStage = {
        patientId: patientProfile._id,
    };
    if (query.fromDate || query.toDate) {
        matchStage.date = {
            ...(query.fromDate ? { $gte: query.fromDate } : {}),
            ...(query.toDate ? { $lte: query.toDate } : {}),
        };
    }
    const [items, groupedByWeek, groupedByMonth] = await Promise.all([
        patient_model_1.PatientMoodEntryModel.find(matchStage)
            .select({ moodScore: 1, note: 1, date: 1, _id: 0 })
            .sort({ date: -1 })
            .lean(),
        patient_model_1.PatientMoodEntryModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        year: { $isoWeekYear: '$date' },
                        week: { $isoWeek: '$date' },
                    },
                    averageMoodScore: { $avg: '$moodScore' },
                    entryCount: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': -1, '_id.week': -1 } },
            {
                $project: {
                    _id: 0,
                    period: {
                        $concat: [
                            { $toString: '$_id.year' },
                            '-W',
                            {
                                $cond: [
                                    { $lt: ['$_id.week', 10] },
                                    { $concat: ['0', { $toString: '$_id.week' }] },
                                    { $toString: '$_id.week' },
                                ],
                            },
                        ],
                    },
                    averageMoodScore: { $round: ['$averageMoodScore', 2] },
                    entryCount: 1,
                },
            },
        ]),
        patient_model_1.PatientMoodEntryModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                    averageMoodScore: { $avg: '$moodScore' },
                    entryCount: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
            {
                $project: {
                    _id: 0,
                    period: '$_id',
                    averageMoodScore: { $round: ['$averageMoodScore', 2] },
                    entryCount: 1,
                },
            },
        ]),
    ]);
    const trend = calculateMoodTrend(items.map((item) => ({ moodScore: item.moodScore, date: new Date(item.date) })));
    return {
        items,
        grouped: {
            week: groupedByWeek,
            month: groupedByMonth,
        },
        trend,
    };
};
exports.getMyMoodHistory = getMyMoodHistory;
const severityToSpecializationMap = {
    minimal: ['stress_management', 'general_wellness'],
    mild: ['anxiety', 'stress_management', 'depression'],
    moderate: ['anxiety', 'depression', 'cbt'],
    moderately_severe: ['depression', 'trauma', 'cbt'],
    severe: ['depression', 'trauma', 'crisis_intervention'],
};
const WEIGHTS = {
    severity: 0.35,
    specialization: 0.3,
    language: 0.2,
    availability: 0.15,
};
const clamp = (value, min = 0, max = 1) => {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
};
const normalizeStrings = (values) => values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
const scoreSeverity = (therapistSpecializations, targetSpecializations) => {
    if (targetSpecializations.length === 0 || therapistSpecializations.length === 0) {
        return 0;
    }
    const therapistSet = new Set(therapistSpecializations);
    const overlap = targetSpecializations.filter((target) => therapistSet.has(target)).length;
    return clamp(overlap / targetSpecializations.length);
};
const scoreSpecialization = (therapistSpecializations, patientPreference, targetSpecializations = []) => {
    if (therapistSpecializations.length === 0) {
        return 0;
    }
    if (patientPreference) {
        const preference = patientPreference.trim().toLowerCase();
        if (preference.length > 0 && therapistSpecializations.includes(preference)) {
            return 1;
        }
    }
    if (targetSpecializations.length > 0) {
        return scoreSeverity(therapistSpecializations, targetSpecializations);
    }
    return 0.5;
};
const scoreLanguage = (therapistLanguages, languagePreference) => {
    if (!languagePreference) {
        return therapistLanguages.length > 0 ? 0.5 : 0;
    }
    if (therapistLanguages.length === 0) {
        return 0;
    }
    const preference = languagePreference.trim().toLowerCase();
    return therapistLanguages.includes(preference) ? 1 : 0;
};
const scoreAvailability = (availabilitySlots, nextHours) => {
    const availableSlots = availabilitySlots.filter((slot) => slot.isAvailable && slot.endMinute > slot.startMinute);
    if (availableSlots.length === 0) {
        return 0;
    }
    const now = new Date();
    const horizon = new Date(now.getTime() + nextHours * 60 * 60 * 1000);
    let matchedSlots = 0;
    for (const slot of availableSlots) {
        let inHorizon = false;
        for (let offset = 0; offset <= 14; offset += 1) {
            const candidate = new Date(now);
            candidate.setDate(now.getDate() + offset);
            if (candidate.getDay() !== slot.dayOfWeek) {
                continue;
            }
            const slotStart = new Date(candidate);
            slotStart.setHours(0, 0, 0, 0);
            slotStart.setMinutes(slot.startMinute);
            if (slotStart >= now && slotStart <= horizon) {
                inHorizon = true;
                break;
            }
        }
        if (inHorizon) {
            matchedSlots += 1;
        }
    }
    return clamp(matchedSlots / availableSlots.length);
};
const calculateCompatibilityScore = (input) => {
    const weighted = input.severityScore * WEIGHTS.severity +
        input.specializationScore * WEIGHTS.specialization +
        input.languageScore * WEIGHTS.language +
        input.availabilityScore * WEIGHTS.availability;
    return Number((weighted * 100).toFixed(2));
};
const inferPrimaryNeed = (severityLevel) => {
    if (severityLevel === 'severe' || severityLevel === 'moderately_severe') {
        return 'high_support';
    }
    if (severityLevel === 'moderate') {
        return 'focused_support';
    }
    return 'preventive_support';
};
const getMyTherapistMatches = async (userId, query) => {
    await assertPatientUser(userId);
    const patientProfile = await patient_model_1.default.findOne({ userId }).select('_id').lean();
    if (!patientProfile) {
        throw new error_middleware_1.AppError('Patient profile not found. Please create profile first.', 404);
    }
    const latestAssessment = await patient_model_1.PatientAssessmentModel.findOne({ patientId: patientProfile._id })
        .select({ severityLevel: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .lean();
    if (!latestAssessment) {
        throw new error_middleware_1.AppError('Assessment not found. Please complete assessment first.', 404);
    }
    const targetSpecializations = normalizeStrings(severityToSpecializationMap[latestAssessment.severityLevel] ?? []);
    const therapists = await therapist_model_1.default.find({}, {
        userId: 1,
        displayName: 1,
        specializations: 1,
        languages: 1,
        availabilitySlots: 1,
        yearsOfExperience: 1,
        averageRating: 1,
        maxConcurrentPatients: 1,
        currentActivePatients: 1,
    })
        .limit(500)
        .lean();
    const rankedMatches = therapists
        .map((therapist) => {
        const therapistSpecializations = normalizeStrings(therapist.specializations ?? []);
        const therapistLanguages = normalizeStrings(therapist.languages ?? []);
        const severityScore = scoreSeverity(therapistSpecializations, targetSpecializations);
        const specializationScore = scoreSpecialization(therapistSpecializations, query.specializationPreference, targetSpecializations);
        const languageScore = scoreLanguage(therapistLanguages, query.languagePreference);
        const availabilityScore = scoreAvailability(therapist.availabilitySlots ?? [], query.nextHours);
        const compatibilityScore = calculateCompatibilityScore({
            severityScore,
            specializationScore,
            languageScore,
            availabilityScore,
        });
        const capacityRatio = therapist.maxConcurrentPatients > 0
            ? clamp((therapist.maxConcurrentPatients - therapist.currentActivePatients) / therapist.maxConcurrentPatients)
            : 0;
        return {
            therapist: {
                id: therapist._id.toString(),
                displayName: therapist.displayName,
                specializations: therapist.specializations,
                languages: therapist.languages,
                yearsOfExperience: therapist.yearsOfExperience,
                averageRating: therapist.averageRating,
            },
            compatibilityScore,
            scoreBreakdown: {
                severity: Number((severityScore * 100).toFixed(2)),
                specialization: Number((specializationScore * 100).toFixed(2)),
                language: Number((languageScore * 100).toFixed(2)),
                availability: Number((availabilityScore * 100).toFixed(2)),
            },
            capacityRatio: Number((capacityRatio * 100).toFixed(2)),
        };
    })
        .sort((a, b) => {
        if (b.compatibilityScore !== a.compatibilityScore) {
            return b.compatibilityScore - a.compatibilityScore;
        }
        if (b.capacityRatio !== a.capacityRatio) {
            return b.capacityRatio - a.capacityRatio;
        }
        return b.therapist.averageRating - a.therapist.averageRating;
    })
        .slice(0, 5);
    return {
        algorithm: {
            version: 'v1',
            weights: WEIGHTS,
            formula: 'compatibility = 100 * (0.35*severity + 0.30*specialization + 0.20*language + 0.15*availability)',
        },
        context: {
            assessmentSeverity: latestAssessment.severityLevel,
            derivedPrimaryNeed: inferPrimaryNeed(latestAssessment.severityLevel),
            targetSpecializations,
            languagePreference: query.languagePreference ?? null,
            specializationPreference: query.specializationPreference ?? null,
            nextHours: query.nextHours,
        },
        matches: rankedMatches,
    };
};
exports.getMyTherapistMatches = getMyTherapistMatches;
