import type { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';
import {
	bookPatientSession,
	getMyTherapistEarnings,
	getMySessionHistory,
	getMyTherapistSessions,
	saveMyTherapistSessionNote,
	updateMyTherapistSessionStatus,
} from '../services/session.service';

const getAuthUserId = (req: Request): string => {
	const userId = req.auth?.userId;

	if (!userId) {
		throw new AppError('Authentication required', 401);
	}

	return userId;
};

export const bookMySessionController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);

	if (!req.validatedBookSessionPayload) {
		throw new AppError('Invalid booking payload', 400);
	}

	const session = await bookPatientSession(userId, req.validatedBookSessionPayload);

	sendSuccess(res, session, 'Session booked successfully', 201);
};

export const getMySessionHistoryController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);
	const query = req.validatedPatientSessionHistoryQuery ?? { page: 1, limit: 10 };

	const history = await getMySessionHistory(userId, query);

	sendSuccess(res, history, 'Session history fetched');
};

export const getMyTherapistSessionsController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);
	const query = req.validatedTherapistSessionHistoryQuery ?? { page: 1, limit: 10 };

	const sessions = await getMyTherapistSessions(userId, query);

	sendSuccess(res, sessions, 'Therapist sessions fetched');
};

export const patchMyTherapistSessionController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);

	if (!req.validatedTherapistSessionStatusPayload) {
		throw new AppError('Invalid session status payload', 400);
	}

	const updatedSession = await updateMyTherapistSessionStatus(
		userId,
		String(req.params.id),
		req.validatedTherapistSessionStatusPayload,
	);

	sendSuccess(res, updatedSession, 'Therapist session updated');
};

export const postMyTherapistSessionNoteController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);

	if (!req.validatedTherapistSessionNotePayload) {
		throw new AppError('Invalid session note payload', 400);
	}

	const result = await saveMyTherapistSessionNote(
		userId,
		String(req.params.id),
		req.validatedTherapistSessionNotePayload,
	);

	sendSuccess(res, result, 'Session note saved');
};

export const getMyTherapistEarningsController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);
	const query = req.validatedTherapistEarningsQuery ?? { page: 1, limit: 10 };

	const earnings = await getMyTherapistEarnings(userId, query);

	sendSuccess(res, earnings, 'Therapist earnings fetched');
};
