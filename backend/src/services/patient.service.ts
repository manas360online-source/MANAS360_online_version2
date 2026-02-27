import PatientProfileModel, { PatientAssessmentModel, PatientMoodEntryModel } from '../models/patient.model';
import UserModel from '../models/user.model';
import { AppError } from '../middleware/error.middleware';
import { buildPaginationMeta, normalizePagination } from '../utils/pagination';
import { Types } from 'mongoose';
import TherapistProfileModel from '../models/therapist.model';

interface PatientProfileInput {
	age: number;
	gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
	medicalHistory?: string;
	emergencyContact: {
		name: string;
		relation: string;
		phone: string;
	};
}

interface PatientAssessmentInput {
	type: 'PHQ-9' | 'GAD-7';
	answers: number[];
}

interface PatientAssessmentHistoryQuery {
	type?: 'PHQ-9' | 'GAD-7';
	fromDate?: Date;
	toDate?: Date;
	page: number;
	limit: number;
}

interface PatientMoodHistoryQuery {
	fromDate?: Date;
	toDate?: Date;
}

interface TherapistMatchQuery {
	languagePreference?: string;
	specializationPreference?: string;
	nextHours: number;
}

const safePatientProjection = {
	userId: 1,
	age: 1,
	gender: 1,
	medicalHistory: 1,
	emergencyContact: 1,
	createdAt: 1,
	updatedAt: 1,
} as const;

const safeAssessmentProjection = {
	type: 1,
	answers: 1,
	totalScore: 1,
	severityLevel: 1,
	createdAt: 1,
} as const;

const assertPatientUser = async (userId: string): Promise<void> => {
	const user = await UserModel.findById(userId).select('_id role isDeleted').lean();

	if (!user) {
		throw new AppError('User not found', 404);
	}

	if (user.isDeleted) {
		throw new AppError('User account is deleted', 410);
	}

	if (user.role !== 'patient') {
		throw new AppError('Patient role required', 403);
	}
};

export const createPatientProfile = async (userId: string, input: PatientProfileInput) => {
	await assertPatientUser(userId);

	const existingProfile = await PatientProfileModel.findOne({ userId }).select('_id').lean();
	if (existingProfile) {
		throw new AppError('Patient profile already exists', 409);
	}

	const profile = await PatientProfileModel.create({
		userId,
		age: input.age,
		gender: input.gender,
		medicalHistory: input.medicalHistory,
		emergencyContact: input.emergencyContact,
	});

	return PatientProfileModel.findById(profile._id, safePatientProjection).lean();
};

export const getMyPatientProfile = async (userId: string) => {
	await assertPatientUser(userId);

	const profile = await PatientProfileModel.findOne({ userId }, safePatientProjection).lean();

	if (!profile) {
		throw new AppError('Patient profile not found', 404);
	}

	return profile;
};

const calculateAssessmentScore = (type: 'PHQ-9' | 'GAD-7', answers: number[]) => {
	const expectedLength = type === 'PHQ-9' ? 9 : 7;

	if (answers.length !== expectedLength) {
		throw new AppError(`answers must contain exactly ${expectedLength} values for ${type}`, 422);
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

export const createPatientAssessment = async (userId: string, input: PatientAssessmentInput) => {
	await assertPatientUser(userId);

	const patientProfile = await PatientProfileModel.findOne({ userId }).select('_id').lean();

	if (!patientProfile) {
		throw new AppError('Patient profile not found. Please create profile first.', 404);
	}

	const { totalScore, severityLevel } = calculateAssessmentScore(input.type, input.answers);

	const assessment = await PatientAssessmentModel.create({
		patientId: patientProfile._id,
		type: input.type,
		answers: input.answers,
		totalScore,
		severityLevel,
	});

	return PatientAssessmentModel.findById(assessment._id, safeAssessmentProjection).lean();
};

export const getMyPatientAssessmentHistory = async (userId: string, query: PatientAssessmentHistoryQuery) => {
	await assertPatientUser(userId);

	const patientProfile = await PatientProfileModel.findOne({ userId }).select('_id').lean();

	if (!patientProfile) {
		throw new AppError('Patient profile not found. Please create profile first.', 404);
	}

	const pagination = normalizePagination(
		{ page: query.page, limit: query.limit },
		{ defaultPage: 1, defaultLimit: 10, maxLimit: 50 },
	);

	const mongoFilter: Record<string, unknown> = {
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
		PatientAssessmentModel.countDocuments(mongoFilter),
		PatientAssessmentModel.find(mongoFilter, safeAssessmentProjection)
			.sort({ createdAt: -1 })
			.skip(pagination.skip)
			.limit(pagination.limit)
			.lean(),
	]);

	return {
		items,
		meta: buildPaginationMeta(totalItems, pagination),
	};
};

const calculateMoodTrend = (
	entries: Array<{
		moodScore: number;
		date: Date;
	}>,
): { trend: 'improving' | 'stable' | 'declining'; delta: number } => {
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

export const getMyMoodHistory = async (userId: string, query: PatientMoodHistoryQuery) => {
	await assertPatientUser(userId);

	const patientProfile = await PatientProfileModel.findOne({ userId }).select('_id').lean();

	if (!patientProfile) {
		throw new AppError('Patient profile not found. Please create profile first.', 404);
	}

	const matchStage: {
		patientId: Types.ObjectId;
		date?: {
			$gte?: Date;
			$lte?: Date;
		};
	} = {
		patientId: patientProfile._id,
	};

	if (query.fromDate || query.toDate) {
		matchStage.date = {
			...(query.fromDate ? { $gte: query.fromDate } : {}),
			...(query.toDate ? { $lte: query.toDate } : {}),
		};
	}

	const [items, groupedByWeek, groupedByMonth] = await Promise.all([
		PatientMoodEntryModel.find(matchStage)
			.select({ moodScore: 1, note: 1, date: 1, _id: 0 })
			.sort({ date: -1 })
			.lean(),
		PatientMoodEntryModel.aggregate([
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
		PatientMoodEntryModel.aggregate([
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

	const trend = calculateMoodTrend(
		items.map((item) => ({ moodScore: item.moodScore, date: new Date(item.date) })),
	);

	return {
		items,
		grouped: {
			week: groupedByWeek,
			month: groupedByMonth,
		},
		trend,
	};
};

const severityToSpecializationMap: Record<string, string[]> = {
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
} as const;

const clamp = (value: number, min = 0, max = 1): number => {
	if (value < min) {
		return min;
	}

	if (value > max) {
		return max;
	}

	return value;
};

const normalizeStrings = (values: string[]): string[] =>
	values
		.map((value) => value.trim().toLowerCase())
		.filter((value) => value.length > 0);

const scoreSeverity = (therapistSpecializations: string[], targetSpecializations: string[]): number => {
	if (targetSpecializations.length === 0 || therapistSpecializations.length === 0) {
		return 0;
	}

	const therapistSet = new Set(therapistSpecializations);
	const overlap = targetSpecializations.filter((target) => therapistSet.has(target)).length;

	return clamp(overlap / targetSpecializations.length);
};

const scoreSpecialization = (
	therapistSpecializations: string[],
	patientPreference?: string,
	targetSpecializations: string[] = [],
): number => {
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

const scoreLanguage = (therapistLanguages: string[], languagePreference?: string): number => {
	if (!languagePreference) {
		return therapistLanguages.length > 0 ? 0.5 : 0;
	}

	if (therapistLanguages.length === 0) {
		return 0;
	}

	const preference = languagePreference.trim().toLowerCase();
	return therapistLanguages.includes(preference) ? 1 : 0;
};

const scoreAvailability = (
	availabilitySlots: Array<{
		dayOfWeek: number;
		startMinute: number;
		endMinute: number;
		isAvailable: boolean;
	}>,
	nextHours: number,
): number => {
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

const calculateCompatibilityScore = (input: {
	severityScore: number;
	specializationScore: number;
	languageScore: number;
	availabilityScore: number;
}): number => {
	const weighted =
		input.severityScore * WEIGHTS.severity +
		input.specializationScore * WEIGHTS.specialization +
		input.languageScore * WEIGHTS.language +
		input.availabilityScore * WEIGHTS.availability;

	return Number((weighted * 100).toFixed(2));
};

const inferPrimaryNeed = (severityLevel: string): string => {
	if (severityLevel === 'severe' || severityLevel === 'moderately_severe') {
		return 'high_support';
	}

	if (severityLevel === 'moderate') {
		return 'focused_support';
	}

	return 'preventive_support';
};

export const getMyTherapistMatches = async (userId: string, query: TherapistMatchQuery) => {
	await assertPatientUser(userId);

	const patientProfile = await PatientProfileModel.findOne({ userId }).select('_id').lean();

	if (!patientProfile) {
		throw new AppError('Patient profile not found. Please create profile first.', 404);
	}

	const latestAssessment = await PatientAssessmentModel.findOne({ patientId: patientProfile._id })
		.select({ severityLevel: 1, createdAt: 1 })
		.sort({ createdAt: -1 })
		.lean();

	if (!latestAssessment) {
		throw new AppError('Assessment not found. Please complete assessment first.', 404);
	}

	const targetSpecializations = normalizeStrings(severityToSpecializationMap[latestAssessment.severityLevel] ?? []);

	const therapists = await TherapistProfileModel.find({}, {
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
			const specializationScore = scoreSpecialization(
				therapistSpecializations,
				query.specializationPreference,
				targetSpecializations,
			);
			const languageScore = scoreLanguage(therapistLanguages, query.languagePreference);
			const availabilityScore = scoreAvailability(therapist.availabilitySlots ?? [], query.nextHours);

			const compatibilityScore = calculateCompatibilityScore({
				severityScore,
				specializationScore,
				languageScore,
				availabilityScore,
			});

			const capacityRatio =
				therapist.maxConcurrentPatients > 0
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
			formula:
				'compatibility = 100 * (0.35*severity + 0.30*specialization + 0.20*language + 0.15*availability)',
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

