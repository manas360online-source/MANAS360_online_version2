import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api/patient';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    specialization: '',
    language: '',
    minPrice: '',
    maxPrice: '',
  });
  const [loading, setLoading] = useState(true);

  const loadProviders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await patientApi.listProviders({
        page,
        limit: 8,
        specialization: filters.specialization || undefined,
        language: filters.language || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) * 100 : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) * 100 : undefined,
      });
      const payload = res.data ?? res;
      setProviders(payload.items || []);
      setMeta(payload.meta || { page, limit: 8, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadProviders(1);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="rounded-2xl border border-calm-sage/15 bg-white/80 p-6">Loading providers...</div>;

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Find & Book Therapist</h1>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-4 shadow-soft-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            value={filters.specialization}
            onChange={(e) => setFilters((prev) => ({ ...prev, specialization: e.target.value }))}
            placeholder="Specialization"
            className="rounded-xl border border-calm-sage/20 bg-white px-3 py-2 text-sm"
          />
          <input
            value={filters.language}
            onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value }))}
            placeholder="Language"
            className="rounded-xl border border-calm-sage/20 bg-white px-3 py-2 text-sm"
          />
          <input
            value={filters.minPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
            placeholder="Min Price (₹)"
            className="rounded-xl border border-calm-sage/20 bg-white px-3 py-2 text-sm"
          />
          <input
            value={filters.maxPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
            placeholder="Max Price (₹)"
            className="rounded-xl border border-calm-sage/20 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => loadProviders(1)}
            className="inline-flex min-h-[40px] items-center rounded-full bg-charcoal px-4 text-sm font-medium text-cream"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters({ specialization: '', language: '', minPrice: '', maxPrice: '' });
              void loadProviders(1);
            }}
            className="inline-flex min-h-[40px] items-center rounded-full border border-calm-sage/25 px-4 text-sm font-medium text-charcoal/70"
          >
            Reset
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((p) => (
          <div key={p.id} className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm text-charcoal/65">{p.specialization}</p>
            <p className="text-sm text-charcoal/65">Experience: {p.experience_years || 3}+ years</p>
            <p className="text-sm text-charcoal/65">Languages: {(p.languages || []).join(', ')}</p>
            <p className="mt-2 text-sm font-medium">₹{(p.session_rate / 100).toFixed(0)} / session</p>
            <p className="text-sm">⭐ {Number(p.rating_avg || 4.5).toFixed(1)}</p>
            <div className="mt-4 flex gap-2 text-sm">
              <Link to={`/patient/providers/${p.id}`} className="inline-flex min-h-[38px] items-center rounded-full border border-calm-sage/25 px-4 text-charcoal/75">View</Link>
              <Link to={`/patient/book/${p.id}`} className="inline-flex min-h-[38px] items-center rounded-full bg-charcoal px-4 text-cream">Book Now</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-calm-sage/15 bg-white/80 px-4 py-2 text-sm">
        <span className="text-charcoal/65">
          Page {meta.page} of {Math.max(1, meta.totalPages)} • {meta.total} providers
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => loadProviders(meta.page - 1)}
            className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => loadProviders(meta.page + 1)}
            className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
