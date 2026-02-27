import type { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';
import { getMyTherapistLeads, purchaseMyTherapistLead } from '../services/lead.service';

const getAuthUserId = (req: Request): string => {
	const userId = req.auth?.userId;

	if (!userId) {
		throw new AppError('Authentication required', 401);
	}

	return userId;
};

export const getMyTherapistLeadsController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);
	const query = req.validatedTherapistLeadsQuery ?? { page: 1, limit: 10 };

	const leads = await getMyTherapistLeads(userId, query);

	sendSuccess(res, leads, 'Therapist leads fetched');
};

export const purchaseMyTherapistLeadController = async (req: Request, res: Response): Promise<void> => {
	const userId = getAuthUserId(req);
	const leadId = String(req.params.id);

	const result = await purchaseMyTherapistLead(userId, leadId);

	sendSuccess(res, result, 'Lead purchased successfully');
};
