import { prisma } from '../config/db';
import { AppError } from '../middleware/error.middleware';

const MAX_PAGE_SIZE = 100;

export interface AdminAnalyticsRange {
	from: string;
	to: string;
	organizationKey: number;
}

export interface TemplateCursor {
	lastSessionsCount?: number;
	lastTemplateKey?: number;
}

export interface UtilizationCursor {
	lastWeekStartDate?: string;
	lastTherapistKey?: number;
}

function toDateKey(dateValue: string): number {
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		throw new AppError(`Invalid date: ${dateValue}`, 400);
	}
	const yyyy = date.getUTCFullYear();
	const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(date.getUTCDate()).padStart(2, '0');
	return Number(`${yyyy}${mm}${dd}`);
}

function normalizeLimit(limit?: number): number {
	if (!limit || Number.isNaN(limit)) return 25;
	if (limit < 1) return 1;
	return Math.min(limit, MAX_PAGE_SIZE);
}

export class AdminAnalyticsService {
	async getSummary(range: AdminAnalyticsRange, therapistId?: string) {
		const startKey = toDateKey(range.from);
		const endKey = toDateKey(range.to);

		const [totalsRows, completionRows] = await Promise.all([
			prisma.$queryRawUnsafe(
				`SELECT COUNT(*)::bigint AS total_sessions
				 FROM analytics.fact_session fs
				 WHERE fs.organization_key = $3
				   AND fs.date_key BETWEEN $1 AND $2`,
				startKey,
				endKey,
				range.organizationKey,
			) as Promise<Array<{ total_sessions: bigint | number }>>,
			prisma.$queryRawUnsafe(
				`SELECT
					COUNT(*)::bigint AS started_sessions,
					COUNT(*) FILTER (WHERE fs.is_completed)::bigint AS completed_sessions,
					(COUNT(*) FILTER (WHERE fs.is_completed)::numeric / NULLIF(COUNT(*), 0))::numeric(8,4) AS completion_rate,
					AVG(CASE WHEN fs.is_completed AND fs.duration_seconds IS NOT NULL THEN fs.duration_seconds END)::numeric(12,2) AS avg_completion_seconds
				 FROM analytics.fact_session fs
				 WHERE fs.organization_key = $3
				   AND fs.date_key BETWEEN $1 AND $2`,
				startKey,
				endKey,
				range.organizationKey,
			) as Promise<Array<{ started_sessions: bigint | number; completed_sessions: bigint | number; completion_rate: string | number | null; avg_completion_seconds: string | number | null }>>,
		]);

		let engagementRows: Array<{ engagement_score: string | number | null }> = [];
		try {
			engagementRows = (await prisma.$queryRawUnsafe(
				`SELECT AVG(m.answered_count)::numeric(10,2) AS engagement_score
				 FROM analytics_session_metrics m
				 WHERE m.completed_at >= $1::timestamptz
				   AND m.completed_at <  $2::timestamptz
				   AND ($3::text IS NULL OR m.therapist_id = $3::text)`,
				range.from,
				range.to,
				therapistId ?? null,
			)) as Array<{ engagement_score: string | number | null }>;
		} catch {
			engagementRows = [{ engagement_score: 0 }];
		}

		const totals = totalsRows[0];
		const completion = completionRows[0];
		const engagement = engagementRows[0];

		return {
			totalSessionsConducted: Number(totals?.total_sessions ?? 0),
			startedSessions: Number(completion?.started_sessions ?? 0),
			completedSessions: Number(completion?.completed_sessions ?? 0),
			completionRate: Number(completion?.completion_rate ?? 0),
			averageCompletionSeconds: Number(completion?.avg_completion_seconds ?? 0),
			patientEngagementScore: Number(engagement?.engagement_score ?? 0),
		};
	}

	async getMostUsedTemplates(
		range: AdminAnalyticsRange,
		limit?: number,
		cursor?: TemplateCursor,
	) {
		const pageSize = normalizeLimit(limit);
		const hasCursor = typeof cursor?.lastSessionsCount === 'number' && typeof cursor?.lastTemplateKey === 'number';

		const rows = hasCursor
			? (await prisma.$queryRawUnsafe(
				`WITH agg AS (
					SELECT
						w.template_key,
						SUM(w.total_sessions_conducted)::bigint AS sessions_count
					FROM analytics.mv_admin_weekly_kpi w
					WHERE w.organization_key = $3
					  AND w.week_start_date >= $1::date
					  AND w.week_start_date <  $2::date
					GROUP BY w.template_key
				)
				SELECT
					a.template_key,
					t.template_id,
					t.template_version,
					t.template_name,
					a.sessions_count
				FROM agg a
				JOIN analytics.dim_template t ON t.template_key = a.template_key
				WHERE (a.sessions_count < $4)
				   OR (a.sessions_count = $4 AND a.template_key > $5)
				ORDER BY a.sessions_count DESC, a.template_key ASC
				LIMIT $6`,
				range.from,
				range.to,
				range.organizationKey,
				cursor?.lastSessionsCount,
				cursor?.lastTemplateKey,
				pageSize,
			)) as Array<{ template_key: bigint | number; template_id: string; template_version: number; template_name: string; sessions_count: bigint | number }>
			: (await prisma.$queryRawUnsafe(
				`WITH agg AS (
					SELECT
						w.template_key,
						SUM(w.total_sessions_conducted)::bigint AS sessions_count
					FROM analytics.mv_admin_weekly_kpi w
					WHERE w.organization_key = $3
					  AND w.week_start_date >= $1::date
					  AND w.week_start_date <  $2::date
					GROUP BY w.template_key
				)
				SELECT
					a.template_key,
					t.template_id,
					t.template_version,
					t.template_name,
					a.sessions_count
				FROM agg a
				JOIN analytics.dim_template t ON t.template_key = a.template_key
				ORDER BY a.sessions_count DESC, a.template_key ASC
				LIMIT $4`,
				range.from,
				range.to,
				range.organizationKey,
				pageSize,
			)) as Array<{ template_key: bigint | number; template_id: string; template_version: number; template_name: string; sessions_count: bigint | number }>;

		const next = rows.length
			? {
				lastSessionsCount: Number(rows[rows.length - 1].sessions_count),
				lastTemplateKey: Number(rows[rows.length - 1].template_key),
			}
			: null;

		return {
			items: rows.map((row) => ({
				templateKey: Number(row.template_key),
				templateId: row.template_id,
				templateVersion: row.template_version,
				templateName: row.template_name,
				sessionsCount: Number(row.sessions_count),
			})),
			nextCursor: next,
		};
	}

	async getTherapistUtilization(
		range: AdminAnalyticsRange,
		limit?: number,
		cursor?: UtilizationCursor,
	) {
		const pageSize = normalizeLimit(limit);
		const hasCursor = Boolean(cursor?.lastWeekStartDate) && typeof cursor?.lastTherapistKey === 'number';

		const rows = hasCursor
			? (await prisma.$queryRawUnsafe(
				`WITH weekly AS (
					SELECT
						w.week_start_date,
						w.therapist_key,
						SUM(w.total_sessions_conducted)::bigint AS sessions_per_week
					FROM analytics.mv_admin_weekly_kpi w
					WHERE w.organization_key = $3
					  AND w.week_start_date >= $1::date
					  AND w.week_start_date <  $2::date
					GROUP BY w.week_start_date, w.therapist_key
				)
				SELECT week_start_date, therapist_key, sessions_per_week
				FROM weekly
				WHERE (week_start_date < $4::date)
				   OR (week_start_date = $4::date AND therapist_key > $5)
				ORDER BY week_start_date DESC, therapist_key ASC
				LIMIT $6`,
				range.from,
				range.to,
				range.organizationKey,
				cursor?.lastWeekStartDate,
				cursor?.lastTherapistKey,
				pageSize,
			)) as Array<{ week_start_date: Date; therapist_key: bigint | number; sessions_per_week: bigint | number }>
			: (await prisma.$queryRawUnsafe(
				`WITH weekly AS (
					SELECT
						w.week_start_date,
						w.therapist_key,
						SUM(w.total_sessions_conducted)::bigint AS sessions_per_week
					FROM analytics.mv_admin_weekly_kpi w
					WHERE w.organization_key = $3
					  AND w.week_start_date >= $1::date
					  AND w.week_start_date <  $2::date
					GROUP BY w.week_start_date, w.therapist_key
				)
				SELECT week_start_date, therapist_key, sessions_per_week
				FROM weekly
				ORDER BY week_start_date DESC, therapist_key ASC
				LIMIT $4`,
				range.from,
				range.to,
				range.organizationKey,
				pageSize,
			)) as Array<{ week_start_date: Date; therapist_key: bigint | number; sessions_per_week: bigint | number }>;

		const next = rows.length
			? {
				lastWeekStartDate: rows[rows.length - 1].week_start_date.toISOString().slice(0, 10),
				lastTherapistKey: Number(rows[rows.length - 1].therapist_key),
			}
			: null;

		return {
			items: rows.map((row) => ({
				weekStartDate: row.week_start_date.toISOString().slice(0, 10),
				therapistKey: Number(row.therapist_key),
				sessionsPerWeek: Number(row.sessions_per_week),
			})),
			nextCursor: next,
		};
	}
}

export const adminAnalyticsService = new AdminAnalyticsService();
