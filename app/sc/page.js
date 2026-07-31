'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuditPageWrapper() {
  return (
    <Suspense fallback={null}>
      <AuditPage />
    </Suspense>
  );
}

function AuditPage() {
  const searchParams = useSearchParams();
  const vanId = searchParams.get('van');

  const [van, setVan] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vanId) {
      setError('No van specified.');
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError('');

      const [vansRes, itemsRes] = await Promise.all([
        fetch('/api/vans'),
        fetch(`/api/inventory?van=${vanId}`),
      ]);
      const vansData = await vansRes.json().catch(() => ({}));
      const itemsData = await itemsRes.json().catch(() => ({}));

      if (!vansRes.ok || !itemsRes.ok) {
        setError('Could not load this van\'s inventory.');
        setLoading(false);
        return;
      }

      const matchedVan = (vansData.vans || []).find((v) => String(v.id) === String(vanId));
      setVan(matchedVan || null);
      setItems(itemsData.items || []);
      setLoading(false);
    }

    load();
  }, [vanId]);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return <p className="text-center text-navy-900/40 py-16 text-sm">Loading...</p>;
  }
  if (error) {
    return <p className="text-center text-red-600 py-16 text-sm">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-navy-50 print:bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8 print:py-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <a href="/sc" className="text-sm text-navy-900/60 hover:text-navy-900">
            &larr; Back to Van Stock
          </a>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-navy-900 text-white text-sm font-medium px-4 py-2 hover:bg-ember-600 transition"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-navy-900/10 p-8 print:border-0 print:rounded-none print:p-0 shadow-sm print:shadow-none">
          <div className="flex items-center justify-between border-b-2 border-navy-900 pb-4 mb-6">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-navy-900/50 uppercase mb-1">
                POS360 Field Services
              </p>
              <h1 className="font-display text-2xl font-semibold text-navy-900">
                Van Inventory Audit Sheet
              </h1>
            </div>
            <div className="text-right text-sm text-navy-900/60">
              <p>{today}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-navy-900/40 mb-0.5">Van</p>
              <p className="font-semibold text-navy-900">{van ? van.code : '-'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-navy-900/40 mb-0.5">Location</p>
              <p className="font-semibold text-navy-900">{van ? van.locationName : '-'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-navy-900/40 mb-0.5">
                Technician (print name)
              </p>
              <div className="border-b border-navy-900/30 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-navy-900/40 mb-0.5">
                Date completed
              </p>
              <div className="border-b border-navy-900/30 h-6" />
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-navy-900 text-left text-[11px] uppercase tracking-wide text-navy-900/60">
                <th className="py-2 pr-2">Item</th>
                <th className="py-2 pr-2 w-20">Inv Code</th>
                <th className="py-2 pr-2 w-24 text-right">Expected</th>
                <th className="py-2 pl-2 w-28 text-right">Actual Count</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.itemId} className="border-b border-navy-900/10">
                  <td className="py-2 pr-2 text-navy-900">{it.name}</td>
                  <td className="py-2 pr-2 font-mono text-navy-900/50">#{it.invCode}</td>
                  <td className="py-2 pr-2 text-right font-mono font-semibold text-navy-900">
                    {it.current}
                  </td>
                  <td className="py-2 pl-2">
                    <div className="border-b border-navy-900/30 h-5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-navy-900/10">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-navy-900/40 mb-1">
                Technician signature
              </p>
              <div className="border-b border-navy-900/30 h-8" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-navy-900/40 mb-1">
                Notes / discrepancies
              </p>
              <div className="border-b border-navy-900/30 h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
