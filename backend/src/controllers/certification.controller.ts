import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { getCertificationById, listCertifications } from '../services/certification.service';

export const getCertificationsController = async (_req: Request, res: Response): Promise<void> => {
	const result = await listCertifications();
	sendSuccess(res, result, 'Certifications fetched');
};

export const getCertificationByIdController = async (req: Request, res: Response): Promise<void> => {
	const id = String(req.params.id ?? '').trim();
	const certification = await getCertificationById(id);
	sendSuccess(res, certification, 'Certification fetched');
};
