import { prisma } from '../config/db';
import { AppError } from '../middleware/error.middleware';

const baseSelect = {
	id: true,
	slug: true,
	code: true,
	title: true,
	shortTitle: true,
	subtitle: true,
	level: true,
	levelBadge: true,
	journeyDescription: true,
	durationLabel: true,
	investmentLabel: true,
	monthlyIncomeLabel: true,
	modulesCount: true,
	deliveryMode: true,
	sessionRateLabel: true,
	outcomeLabel: true,
	prerequisitesLabel: true,
	primaryCtaLabel: true,
	secondaryCtaLabel: true,
	isInvitationOnly: true,
	enrollmentOpen: true,
	sortOrder: true,
	isActive: true,
	metadata: true,
	createdAt: true,
	updatedAt: true,
};

export const listCertifications = async () => {
	const items = await prisma.certification.findMany({
		where: { isActive: true },
		orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
		select: baseSelect,
	});

	return {
		items,
		total: items.length,
	};
};

export const getCertificationById = async (idOrSlug: string) => {
	const normalized = idOrSlug.trim();
	if (!normalized) {
		throw new AppError('Certification id is required', 400);
	}

	const certification = await prisma.certification.findFirst({
		where: {
			OR: [{ id: normalized }, { slug: normalized }, { code: normalized }],
			isActive: true,
		},
		select: baseSelect,
	});

	if (!certification) {
		throw new AppError('Certification not found', 404, { id: normalized });
	}

	return certification;
};
