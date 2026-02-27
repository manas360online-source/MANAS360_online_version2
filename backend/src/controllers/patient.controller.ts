import type { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import {
	createPatientAssessment,
	createPatientProfile,
	getMyMoodHistory,
	getMyPatientAssessmentHistory,
	getMyPatientProfile,
	getMyTherapistMatches,
} from '../services/patient.service';
import { sendSuccess } from '../utils/response';

const getAuthUserId = (req: Request): string => {
	const userId = req.auth?.userId;

	if (!userId) {
		throw new AppError('Authentication required', 401);
	}

	return userId;
};

export const createPatientProfileController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);

	if (!req.validatedPatientProfile) {
		throw new AppError('Invalid patient profile payload', 400);
	}

	const profile = await createPatientProfile(userId, req.validatedPatientProfile);

	sendSuccess(res, profile, 'Patient profile created', 201);
};

export const getMyPatientProfileController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);
	const profile = await getMyPatientProfile(userId);

	sendSuccess(res, profile, 'Patient profile fetched');
};

export const createPatientAssessmentController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);

	if (!req.validatedPatientAssessment) {
		throw new AppError('Invalid assessment payload', 400);
	}

	const assessment = await createPatientAssessment(userId, req.validatedPatientAssessment);

	sendSuccess(res, assessment, 'Assessment submitted', 201);
};

export const getMyPatientAssessmentHistoryController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);

	if (!req.validatedPatientAssessmentHistoryQuery) {
		throw new AppError('Invalid assessment history query', 400);
	}

	const result = await getMyPatientAssessmentHistory(userId, req.validatedPatientAssessmentHistoryQuery);

	sendSuccess(res, result, 'Assessment history fetched');
};

export const getMyMoodHistoryController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);
	const query = req.validatedPatientMoodHistoryQuery ?? {};

	const moodHistory = await getMyMoodHistory(userId, query);

	sendSuccess(res, moodHistory, 'Mood history fetched');
};

export const getMyTherapistMatchesController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);

	if (!req.validatedTherapistMatchQuery) {
		throw new AppError('Invalid therapist match query', 400);
	}

	const matches = await getMyTherapistMatches(userId, req.validatedTherapistMatchQuery);

	sendSuccess(res, matches, 'Therapist matches fetched');
};

