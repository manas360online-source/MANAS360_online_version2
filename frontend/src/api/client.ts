type Resp<T> = { data: T };

const base = '/api';

const parseResponse = async <T = any>(res: Response): Promise<Resp<T>> => {
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const message = data?.message || data?.error || `Request failed with status ${res.status}`;
		throw new Error(message);
	}
	return { data } as Resp<T>;
};

const client = {
	async get<T = any>(url: string) {
		const res = await fetch(base + url, { credentials: 'same-origin' });
		return parseResponse<T>(res);
	},
	async post<T = any>(url: string, body?: any) {
		const res = await fetch(base + url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
		return parseResponse<T>(res);
	},
};

export default client;
