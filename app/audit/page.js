'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuditSheet } from './AuditSheet';
import { AuditFrame, AuditMessage, auditBackHref, todayLong } from './AuditFrame';

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
  const from = auditBackHref(searchParams);

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
        setError("Could not load this van's item list.");
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

  return (
    <AuditFrame from={from} printLabel="Print / Save as PDF">
      {loading ? (
        <AuditMessage>Loading...</AuditMessage>
      ) : error ? (
        <AuditMessage>{error}</AuditMessage>
      ) : (
        <AuditSheet van={van} items={items} today={todayLong()} />
      )}
    </AuditFrame>
  );
}
