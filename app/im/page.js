'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, LogoutButton } from '../../components/TopBar';
import { AuditButtons } from '../../components/AuditButtons';
import {
  Tabs,
  Toast,
  PlusIcon,
  CodeTag,
  CategoryFilters,
  DateRange,
  EmptyState,
  useDefaultRange,
} from '../../components/ui';
import { CATEGORIES, filterItems } from '../../lib/categories';

const TABS = [
  { key: 'load', label: 'Load Van' },
  { key: 'history', label: 'History' },
  { key: 'allSummary', label: 'All Vans' },
];

export default function ImPage() {
  const router = useRouter();
  const [tab, setTab] = useState('load');
  const [vans, setVans] = useState([]);
  const [vanId, setVanId] = useState('');

  useEffect(() => {
    fetch('/api/vans')
      .then((r) => r.json())
      .then((data) => {
        setVans(data.vans || []);
        if (data.vans && data.vans.length > 0) setVanId(String(data.vans[0].id));
      });
  }, []);

  async function handleLogout() {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'im' }),
    });
    router.push('/');
    router.refresh();
  }

  return (
    <main className="min-h-screen pb-32">
      <TopBar right={<LogoutButton onClick={handleLogout} />} />

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="panel px-4 sm:px-7 pt-4 pb-5">
          <p className="section-title mb-3">Inventory Management</p>
          {tab !== 'allSummary' && (
            <select
              value={vanId}
              onChange={(e) => setVanId(e.target.value)}
              aria-label="Van"
              className="input mb-3"
            >
              {vans.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.locationName} · {v.code}
                </option>
              ))}
            </select>
          )}
          <div className="mb-2">
            <AuditButtons vans={vans} vanId={vanId} from="im" />
          </div>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <div className="divider my-4" />

          {tab === 'load' ? (
            <LoadTab vanId={vanId} />
          ) : tab === 'history' ? (
            <HistoryTab vanId={vanId} />
          ) : (
            <AllVanSummaryTab />
          )}
        </div>
      </div>
    </main>
  );
}

function LoadTab({ vanId }) {
  const [items, setItems] = useState([]);
  const [adds, setAdds] = useState({}); // itemId -> qty being added this session
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Set()); // category filter keys
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const loadItems = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/inventory?van=${id}`);
    const data = await res.json();
    setItems(data.items || []);
    setAdds({});
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems(vanId);
  }, [vanId, loadItems]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function change(itemId, dir) {
    setAdds((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) + dir) }));
  }

  async function handleSubmit() {
    const changes = Object.entries(adds)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId: Number(itemId), delta: qty }));
    if (changes.length === 0) return;

    setSubmitting(true);
    const res = await fetch('/api/inventory/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vanId: Number(vanId), changes }),
    });
    setSubmitting(false);

    if (res.ok) {
      showToast('Sent to Supply Chain.');
      loadItems(vanId);
    } else {
      showToast('Submit failed. Try again.');
    }
  }

  // Items with unsent taps or awaiting confirmation stay visible whatever the
  // filters, so nothing disappears mid-load.
  const filteredItems = useMemo(
    () => filterItems(items, { selected, query, keep: (it) => (adds[it.itemId] || 0) > 0 || it.pending > 0 }),
    [items, selected, query, adds]
  );

  const lineCount = Object.values(adds).filter((q) => q > 0).length;
  const unitCount = Object.values(adds).reduce((s, q) => s + q, 0);

  return (
    <>
      <p className="text-sm text-muted mb-3">
        Tap <span className="text-white font-semibold">+</span> for each item loaded into this van, then send it to
        Supply Chain.
      </p>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search all items or code..."
        className="input mb-3"
      />
      <div className="mb-4">
        <CategoryFilters categories={CATEGORIES} selected={selected} onChange={setSelected} />
      </div>

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : (
        <ul className="space-y-2">
          {filteredItems.map((it) => {
            const qty = adds[it.itemId] || 0;
            return (
              <li
                key={it.itemId}
                className={`tile px-3 py-2.5 flex items-center gap-3 ${qty > 0 ? '!border-primary/50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">{it.name}</p>
                  <p className="text-[11px] text-dim">
                    <CodeTag code={it.invCode} dup={it.dupCode} />
                    {it.pending > 0 && (
                      <span className="ml-2 text-primary font-semibold">{it.pending} awaiting confirmation</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`w-8 text-center text-lg font-bold tabular-nums ${qty > 0 ? 'text-primary' : 'text-dim'}`}
                  >
                    {qty > 0 ? `+${qty}` : '0'}
                  </span>
                  <button
                    aria-label={`Add one ${it.name}`}
                    onClick={() => change(it.itemId, 1)}
                    className="tile-btn !h-9 !w-9 !p-0"
                  >
                    <PlusIcon />
                  </button>
                </div>
              </li>
            );
          })}
          {filteredItems.length === 0 && <EmptyState>No items match.</EmptyState>}
        </ul>
      )}

      <div
        className="fixed bottom-0 inset-x-0 z-20 px-4 py-4"
        style={{ background: 'rgba(14,14,17,0.9)', borderTop: '1px solid var(--line)', backdropFilter: 'blur(14px)' }}
      >
        <div className="max-w-2xl mx-auto flex gap-2">
          {lineCount > 0 && !submitting && (
            <button onClick={() => setAdds({})} className="btn-ghost !h-[54px] shrink-0">
              Clear
            </button>
          )}
          <button onClick={handleSubmit} disabled={submitting || lineCount === 0} className="tile-hero">
            {submitting
              ? 'Sending...'
              : lineCount
              ? `Send ${unitCount} unit${unitCount === 1 ? '' : 's'} (${lineCount} item${lineCount === 1 ? '' : 's'})`
              : 'Nothing added yet'}
          </button>
        </div>
      </div>

      <Toast message={toast} />
    </>
  );
}

function HistoryTab({ vanId }) {
  const { today, weekAgo } = useDefaultRange();
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(today);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    if (!vanId) return;
    setLoading(true);
    setError('');
    const res = await fetch(`/api/inventory/history?van=${vanId}&start=${start}&end=${end}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setLoads(data.loads || []);
    else setError(data.error || 'Something went wrong loading history.');
    setLoading(false);
  }, [vanId, start, end]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <>
      <p className="text-sm text-muted mb-3">Everything Supply Chain confirmed as loaded into this van.</p>
      <DateRange start={start} end={end} setStart={setStart} setEnd={setEnd} max={today} />
      <div className="mt-4">
        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : loads.length === 0 ? (
          <EmptyState>Nothing loaded into this van in this date range.</EmptyState>
        ) : (
          <div className="space-y-3">
            {loads.map((load) => (
              <div key={load.completedAt} className="tile p-3">
                <p className="section-title mb-2">{new Date(load.completedAt).toLocaleString()}</p>
                <ul className="space-y-1">
                  {load.items.map((it) => (
                    <li key={it.itemId} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 min-w-0 text-white leading-snug">
                        {it.name} <span className="text-[11px] text-dim">#{it.invCode}</span>
                      </span>
                      <span className="font-bold tabular-nums text-synced">+{it.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AllVanSummaryTab() {
  const { today, weekAgo } = useDefaultRange();
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(today);
  const [vans, setVans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/inventory/all-summary?start=${start}&end=${end}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setVans(data.vans || []);
    else setError(data.error || 'Something went wrong loading the summary.');
    setLoading(false);
  }, [start, end]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <>
      <p className="text-sm text-muted mb-3">Totals loaded into every van over the date range.</p>
      <DateRange start={start} end={end} setStart={setStart} setEnd={setEnd} max={today} />
      <div className="mt-4">
        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : vans.length === 0 ? (
          <EmptyState>Nothing loaded into any van in this date range.</EmptyState>
        ) : (
          <div className="space-y-3">
            {vans.map((van) => (
              <div key={van.vanId} className="tile p-3">
                <p className="text-sm font-bold text-white mb-2">
                  {van.locationName} · {van.code}
                </p>
                <ul className="divide-y divide-white/5">
                  {van.items.map((it) => (
                    <li key={it.itemId} className="py-1.5 flex items-center gap-3 text-sm">
                      <span className="flex-1 min-w-0 text-white leading-snug">
                        {it.name} <span className="text-[11px] text-dim">#{it.invCode}</span>
                      </span>
                      <span className="font-bold tabular-nums text-synced">+{it.added}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
