'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuditFrame, AuditMessage } from '../../audit/AuditFrame';

export default function SummaryPageWrapper() {
  return (
    <Suspense fallback={null}>
      <SummaryPage />
    </Suspense>
  );
}

// Printable record of one "Update all vans" confirmation.
function SummaryPage() {
  const at = useSearchParams().get('at');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!at) {
      setError('No update specified.');
      return;
    }
    fetch(`/api/reports/batch?at=${encodeURIComponent(at)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.ok) setData(body);
        else setError(body.error || 'Could not load this update.');
      })
      .catch(() => setError('Could not load this update.'));
  }, [at]);

  return (
    <AuditFrame from="/sc" printLabel="Print / Save as PDF">
      {error ? (
        <AuditMessage>{error}</AuditMessage>
      ) : !data ? (
        <AuditMessage>Loading...</AuditMessage>
      ) : (
        <SummarySheet completedAt={data.completedAt} vans={data.vans} />
      )}
    </AuditFrame>
  );
}

function SummarySheet({ completedAt, vans }) {
  const totalUnits = vans.reduce((s, v) => s + v.items.reduce((t, it) => t + it.qty, 0), 0);
  const when = completedAt ? new Date(completedAt).toLocaleString() : '-';

  return (
    <div className="bg-white text-black rounded-[18px] p-8 print:rounded-none print:p-0">
      <div
        className="flex items-center justify-between rounded-[10px] px-4 py-2.5 mb-4"
        style={{ background: '#0A0A0B', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pos360-logo.png" alt="POS360" className="h-8 w-auto" />
        <div className="text-right leading-none">
          <p className="text-[13px] font-extrabold tracking-[0.14em] uppercase text-white">Van Load Summary</p>
          <p className="text-[8px] font-semibold tracking-[0.3em] uppercase mt-1" style={{ color: '#EF4023' }}>
            Supply Chain Ops
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
        <Field label="Confirmed">{when}</Field>
        <Field label="Vans">{vans.length}</Field>
        <Field label="Total units">{totalUnits}</Field>
      </div>

      {vans.length === 0 ? (
        <p className="text-sm text-black/50">Nothing was confirmed in this update.</p>
      ) : (
        <div className="space-y-5">
          {vans.map((van) => (
            <div key={van.vanId} className="break-inside-avoid">
              <p className="text-sm font-bold border-b-2 border-black pb-1 mb-1">
                {van.locationName} · {van.code}
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wide text-black/60">
                    <th className="py-1 pr-2">Item</th>
                    <th className="py-1 pr-2 w-16 text-right">Code</th>
                    <th className="py-1 w-14 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {van.items.map((it) => (
                    <tr key={it.itemId} className="border-t border-black/10">
                      <td className="py-1 pr-2 leading-tight">{it.name}</td>
                      <td className="py-1 pr-2 text-right text-black/50 tabular-nums">#{it.invCode}</td>
                      <td className="py-1 text-right font-bold tabular-nums">+{it.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-black/15">
        <Field label="Confirmed by">
          <div className="border-b border-black/40 h-8" />
        </Field>
        <Field label="Notes">
          <div className="border-b border-black/40 h-8" />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/50 mb-0.5">{label}</p>
      <div className="font-bold">{children}</div>
    </div>
  );
}
