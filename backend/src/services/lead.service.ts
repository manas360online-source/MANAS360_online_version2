import { AppError } from '../middleware/error.middleware';
import { prisma } from '../config/db';
import { buildPaginationMeta, normalizePagination } from '../utils/pagination';

const db = prisma as any;

interface TherapistLeadsQuery {
	status?: 'available' | 'purchased';
	page: number;
	limit: number;
}

const assertTherapistUser = async (userId: string): Promise<void> => {
	const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });

	if (!user) {
		throw new AppError('User not found', 404);
	}

	if (String(user.role) !== 'THERAPIST') {
		throw new AppError('Therapist role required', 403);
	}
};

export const getMyTherapistLeads = async (userId: string, query: TherapistLeadsQuery) => {
	await assertTherapistUser(userId);

	const pagination = normalizePagination(
		{ page: query.page, limit: query.limit },
		{ defaultPage: 1, defaultLimit: 10, maxLimit: 50 },
	);

	return {
		items: [],
		meta: buildPaginationMeta(0, pagination),
		migrationPending: true,
		message: 'Lead marketplace is temporarily unavailable until Prisma lead models are introduced.',
	};
};

export const purchaseMyTherapistLead = async (userId: string, leadId: string) => {
	await assertTherapistUser(userId);

	throw new AppError('Lead purchase is unavailable until lead marketplace is migrated to Prisma', 501, {
		leadId,
	});
};
