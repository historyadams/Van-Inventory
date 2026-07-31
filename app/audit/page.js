'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuditSheet } from '../AuditSheet';

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
  const from = searchParams.get('from') === 'im' ? '/im' : '/sc';

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
            Print / Save as PDF
          </button>
        </div>

        <AuditSheet van={van} items={items} today={today} />
      </div>
    </div>
  );
}

