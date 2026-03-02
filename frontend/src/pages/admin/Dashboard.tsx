import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import {
	getAdminAnalyticsSummary,
	getAdminTemplateUsage,
	getAdminTherapistUtilization,
	type AdminTemplateUsageItem,
	type AdminUtilizationItem,
} from '../../api/admin.api';

const toDateInput = (value: Date) => value.toISOString().slice(0, 10);
const COLORS = ['#1d4ed8', '#0369a1', '#0f766e', '#7c3aed', '#be185d', '#ea580c'];

function downloadCsv(filename: string, rows: string[][]) {
	const csvContent = rows
		.map((row) => row.map((cell) => `"${String(cell).split('"').join('""')}"`).join(','))
		.join('\n');
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

const KpiCard = ({ label, value }: { label: string; value: string }) => (
	<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
		<p className="text-sm text-slate-500">{label}</p>
		<p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
	</div>
);

export default function AdminDashboardPage() {
	const defaultTo = new Date();
	const defaultFrom = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);

	const [from, setFrom] = useState(toDateInput(defaultFrom));
	const [to, setTo] = useState(toDateInput(defaultTo));
	const [organizationKey, setOrganizationKey] = useState(1);

	const summaryQ = useQuery({
		queryKey: ['admin-analytics', 'summary', from, to, organizationKey],
		queryFn: () => getAdminAnalyticsSummary({ from, to, organizationKey }),
		staleTime: 60_000,
	});

	const templatesQ = useQuery({
		queryKey: ['admin-analytics', 'templates', from, to, organizationKey],
		queryFn: () => getAdminTemplateUsage({ from, to, organizationKey, limit: 10 }),
		staleTime: 60_000,
	});

	const utilizationQ = useQuery({
		queryKey: ['admin-analytics', 'utilization', from, to, organizationKey],
		queryFn: () => getAdminTherapistUtilization({ from, to, organizationKey, limit: 100 }),
		staleTime: 60_000,
	});

	const templateItems = templatesQ.data?.data.items ?? [];
	const utilizationItems = utilizationQ.data?.data.items ?? [];
	const summary = summaryQ.data?.data ?? {
		totalSessionsConducted: 0,
		startedSessions: 0,
		completedSessions: 0,
		completionRate: 0,
		averageCompletionSeconds: 0,
		patientEngagementScore: 0,
	};

	const sessionsOverTime = useMemo(() => {
		const map = new Map<string, number>();
		for (const row of utilizationItems) {
			map.set(row.weekStartDate, (map.get(row.weekStartDate) ?? 0) + row.sessionsPerWeek);
		}
		return Array.from(map.entries())
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(([weekStartDate, sessions]) => ({ weekStartDate, sessions }));
	}, [utilizationItems]);

	const latestWeekTherapists = useMemo(() => {
		if (!utilizationItems.length) return [] as AdminUtilizationItem[];
		const latestWeek = utilizationItems.reduce((acc, cur) => (cur.weekStartDate > acc ? cur.weekStartDate : acc), utilizationItems[0].weekStartDate);
		return utilizationItems
			.filter((item) => item.weekStartDate === latestWeek)
			.sort((a, b) => b.sessionsPerWeek - a.sessionsPerWeek)
			.slice(0, 10);
	}, [utilizationItems]);

	const onExport = () => {
		const rows: string[][] = [
			['section', 'metric', 'value'],
			['summary', 'total_sessions', String(summary.totalSessionsConducted)],
			['summary', 'completion_rate', String(summary.completionRate)],
			['summary', 'avg_completion_seconds', String(summary.averageCompletionSeconds)],
			['summary', 'engagement_score', String(summary.patientEngagementScore)],
			['', '', ''],
			['templates', 'template_name', 'sessions_count'],
			...templateItems.map((item: AdminTemplateUsageItem) => ['templates', item.templateName, String(item.sessionsCount)]),
			['', '', ''],
			['utilization', 'week_start_date:therapist_key', 'sessions_per_week'],
			...utilizationItems.map((item: AdminUtilizationItem) => ['utilization', `${item.weekStartDate}:${item.therapistKey}`, String(item.sessionsPerWeek)]),
		];

		downloadCsv(`admin-analytics-${from}-to-${to}.csv`, rows);
	};

	return (
		<div className="responsive-page">
			<div className="responsive-container section-stack">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Admin Analytics Dashboard</h1>
						<p className="mt-1 text-sm text-slate-600">Performance, usage, and utilization insights for admins.</p>
					</div>
					<button
						onClick={onExport}
						className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
					>
						Export CSV
					</button>
				</div>

				<div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
					<label className="text-sm text-slate-700">
						From
						<input
							type="date"
							value={from}
							onChange={(e) => setFrom(e.target.value)}
							className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
						/>
					</label>
					<label className="text-sm text-slate-700">
						To
						<input
							type="date"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
						/>
					</label>
					<label className="text-sm text-slate-700">
						Organization Key
						<input
							type="number"
							min={1}
							value={organizationKey}
							onChange={(e) => setOrganizationKey(Number(e.target.value) || 1)}
							className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
						/>
					</label>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<KpiCard label="Total Sessions" value={String(summary.totalSessionsConducted)} />
					<KpiCard label="Completion Rate" value={`${Number(summary.completionRate).toFixed(2)}%`} />
					<KpiCard
						label="Avg Completion Time"
						value={`${Math.round(Number(summary.averageCompletionSeconds) / 60)} min`}
					/>
				</div>

				<div className="grid gap-4 xl:grid-cols-2">
					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<h2 className="mb-3 text-sm font-medium text-slate-700">Sessions Over Time (Weekly)</h2>
						<div className="h-72 w-full">
							<ResponsiveContainer>
								<LineChart data={sessionsOverTime}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="weekStartDate" />
									<YAxis />
									<Tooltip />
									<Line type="monotone" dataKey="sessions" stroke="#1d4ed8" strokeWidth={2} dot={false} />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<h2 className="mb-3 text-sm font-medium text-slate-700">Template Usage Distribution</h2>
						<div className="h-72 w-full">
							<ResponsiveContainer>
								<PieChart>
									<Pie
										data={templateItems}
										nameKey="templateName"
										dataKey="sessionsCount"
										cx="50%"
										cy="50%"
										outerRadius={96}
										label
									>
										{templateItems.map((entry, index) => (
											<Cell key={entry.templateKey} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<h2 className="mb-3 text-sm font-medium text-slate-700">Therapist Utilization (Top 10 in Latest Week)</h2>
					<div className="h-72 w-full">
						<ResponsiveContainer>
							<BarChart data={latestWeekTherapists}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="therapistKey" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="sessionsPerWeek" fill="#0f766e" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{(summaryQ.isLoading || templatesQ.isLoading || utilizationQ.isLoading) && (
					<p className="text-sm text-slate-500">Loading analytics...</p>
				)}
				{(summaryQ.isError || templatesQ.isError || utilizationQ.isError) && (
					<p className="text-sm text-rose-600">Failed to load analytics data. Please verify admin access and filters.</p>
				)}
			</div>
		</div>
	);
}
