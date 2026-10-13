'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuditSheet } from '../AuditSheet';
import { AuditFrame, AuditMessage, auditBackHref, todayLong } from '../AuditFrame';

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
  const from = auditBackHref(searchParams);

  const [sheets, setSheets] = useState([]); // [{ van, items }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const vanIds = vanIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
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
          return { id, van: matchedVan || null, items: res.ok ? data.items || [] : [] };
        })
      );

      setSheets(results);
      setLoading(false);
    }

    load();
  }, [vanIdsParam]);

  const today = todayLong();

  return (
    <AuditFrame
      from={from}
      printLabel={`Print / Save as PDF (${sheets.length} van${sheets.length === 1 ? '' : 's'})`}
    >
      {loading ? (
        <AuditMessage>Loading...</AuditMessage>
      ) : error ? (
        <AuditMessage>{error}</AuditMessage>
      ) : (
        <div className="space-y-6 print:space-y-0">
          {sheets.map((s, i) => (
            <AuditSheet
              key={s.id}
              van={s.van}
              items={s.items}
              today={today}
              pageBreakAfter={i < sheets.length - 1}
            />
          ))}
        </div>
      )}
    </AuditFrame>
  );
}
