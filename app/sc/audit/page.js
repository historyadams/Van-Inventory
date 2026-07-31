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

  const half = Math.ceil(items.length / 2);
  const firstHalf = items.slice(0, half);
  const secondHalf = items.slice(half);

  return (
    <div className="min-h-screen bg-navy-50 print:bg-white">
      <style>{`
        @page {
          size: letter portrait;
          margin: 0.4in;
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-6 py-8 print:py-0 print:max-w-none">
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
          <div className="flex items-center justify-between border-b-2 border-navy-900 pb-3 mb-4 print:pb-2 print:mb-3">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-navy-900/50 uppercase mb-1 print:mb-0">
                POS360 Field Services
              </p>
              <h1 className="font-display text-2xl font-semibold text-navy-900 print:text-xl">
                Van Inventory Audit Sheet
              </h1>
            </div>
            <div className="text-right text-sm text-navy-900/60">
              <p>{today}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4 print:mb-3 text-sm">
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

          <div className="grid grid-cols-2 gap-6 print:gap-4">
            <ItemTable items={firstHalf} />
            <ItemTable items={secondHalf} />
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8 pt-4 print:mt-6 print:pt-3 border-t border-navy-900/10">
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

function ItemTable({ items }) {
  return (
    <table className="w-full text-xs print:text-[10.5px] border-collapse">
      <thead>
        <tr className="border-b-2 border-navy-900 text-left text-[10px] uppercase tracking-wide text-navy-900/60">
          <th className="py-1.5 pr-1">Item</th>
          <th className="py-1.5 pr-1 w-12 text-right">Code</th>
          <th className="py-1.5 pr-1 w-14 text-right">Exp.</th>
          <th className="py-1.5 pl-1 w-16 text-right">Actual</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.itemId} className="border-b border-navy-900/10">
            <td className="py-1 pr-1 text-navy-900 leading-tight">{it.name}</td>
            <td className="py-1 pr-1 font-mono text-navy-900/50 text-right">#{it.invCode}</td>
            <td className="py-1 pr-1 text-right font-mono font-semibold text-navy-900">
              {it.current}
            </td>
            <td className="py-1 pl-1">
              <div className="border-b border-navy-900/30 h-4" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
