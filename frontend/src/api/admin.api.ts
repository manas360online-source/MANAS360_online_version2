import client from './client';

type ApiEnvelope<T> = {
	success: boolean;
	message?: string;
	data: T;
};

export type AdminAnalyticsSummary = {
	totalSessionsConducted: number;
	startedSessions: number;
	completedSessions: number;
	completionRate: number;
	averageCompletionSeconds: number;
	patientEngagementScore: number;
};

export type AdminTemplateUsageItem = {
	templateKey: number;
	templateId: string;
	templateVersion: number;
	templateName: string;
	sessionsCount: number;
};

export type AdminUtilizationItem = {
	weekStartDate: string;
	therapistKey: number;
	sessionsPerWeek: number;
};

export type RangeParams = {
	from: string;
	to: string;
	organizationKey: number;
	limit?: number;
};

const buildQuery = (params: Record<string, string | number | undefined>) => {
	const query = Object.entries(params)
		.filter(([, value]) => value !== undefined && value !== '')
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');

	return query ? `?${query}` : '';
};

export const getAdminAnalyticsSummary = async (
	params: RangeParams & { therapistId?: string },
): Promise<ApiEnvelope<AdminAnalyticsSummary>> => {
	const query = buildQuery({
		from: params.from,
		to: params.to,
		organizationKey: params.organizationKey,
		therapistId: params.therapistId,
	});
	return (await client.get<ApiEnvelope<AdminAnalyticsSummary>>(`/v1/admin/analytics/summary${query}`)).data;
};

export const getAdminTemplateUsage = async (
	params: RangeParams & { lastSessionsCount?: number; lastTemplateKey?: number },
): Promise<ApiEnvelope<{ items: AdminTemplateUsageItem[]; nextCursor: { lastSessionsCount: number; lastTemplateKey: number } | null }>> => {
	const query = buildQuery({
		from: params.from,
		to: params.to,
		organizationKey: params.organizationKey,
		limit: params.limit,
		lastSessionsCount: params.lastSessionsCount,
		lastTemplateKey: params.lastTemplateKey,
	});
	return (await client.get<ApiEnvelope<{ items: AdminTemplateUsageItem[]; nextCursor: { lastSessionsCount: number; lastTemplateKey: number } | null }>>(`/v1/admin/analytics/templates${query}`)).data;
};

export const getAdminTherapistUtilization = async (
	params: RangeParams & { lastWeekStartDate?: string; lastTherapistKey?: number },
): Promise<ApiEnvelope<{ items: AdminUtilizationItem[]; nextCursor: { lastWeekStartDate: string; lastTherapistKey: number } | null }>> => {
	const query = buildQuery({
		from: params.from,
		to: params.to,
		organizationKey: params.organizationKey,
		limit: params.limit,
		lastWeekStartDate: params.lastWeekStartDate,
		lastTherapistKey: params.lastTherapistKey,
	});
	return (await client.get<ApiEnvelope<{ items: AdminUtilizationItem[]; nextCursor: { lastWeekStartDate: string; lastTherapistKey: number } | null }>>(`/v1/admin/analytics/utilization${query}`)).data;
};
