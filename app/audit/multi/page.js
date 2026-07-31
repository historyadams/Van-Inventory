'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuditSheet } from '../AuditSheet';

export default function MultiAuditPageWrapper() {
  return (
    <Suspense fallback={null}>
      <MultiAuditPage />
    </Suspense>
  );
}

function MultiAuditPage() {
  const searchParams = useSearchParams();
  const vanIdsParam = searchParams.get('vans') || '';
  const from = searchParams.get('from') === 'im' ? '/im' : '/sc';
  const vanIds = vanIdsParam.split(',').map((s) => s.trim()).filter(Boolean);

  const [sheets, setSheets] = useState([]); // [{ van, items }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vanIds.length === 0) {
      setError('No vans specified.');
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError('');

      const vansRes = await fetch('/api/vans');
      const vansData = await vansRes.json().catch(() => ({}));
      if (!vansRes.ok) {
        setError('Could not load van list.');
        setLoading(false);
        return;
      }

      const results = await Promise.all(
        vanIds.map(async (id) => {
          const res = await fetch(`/api/inventory?van=${id}`);
          const data = await res.json().catch(() => ({}));
          const matchedVan = (vansData.vans || []).find((v) => String(v.id) === String(id));
          return { van: matchedVan || null, items: res.ok ? data.items || [] : [] };
        })
      );

      setSheets(results);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vanIdsParam]);

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
      <style>{`
        @page {
          size: letter portrait;
          margin: 0.4in;
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-6 py-8 print:py-0 print:max-w-none">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <a href={from} className="text-sm text-navy-900/60 hover:text-navy-900">
            &larr; Back to Van Stock
          </a>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-navy-900 text-white text-sm font-medium px-4 py-2 hover:bg-ember-600 transition"
          >
            Print / Save as PDF ({sheets.length} van{sheets.length === 1 ? '' : 's'})
          </button>
        </div>

        <div className="space-y-8 print:space-y-0">
          {sheets.map((s, i) => (
            <AuditSheet
              key={s.van ? s.van.vanId || i : i}
              van={s.van}
              items={s.items}
              today={today}
              pageBreakAfter={i < sheets.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
