'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ImPage() {
  const router = useRouter();
  const [tab, setTab] = useState('adjust'); // 'adjust' | 'history' | 'allSummary'
  const [vans, setVans] = useState([]);
  const [vanId, setVanId] = useState('');
  const [items, setItems] = useState([]);
  const [sessionDeltas, setSessionDeltas] = useState({}); // itemId -> delta
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [multiOpen, setMultiOpen] = useState(false);

  useEffect(() => {
    fetch('/api/vans')
      .then((r) => r.json())
      .then((data) => {
        setVans(data.vans || []);
        if (data.vans && data.vans.length > 0) setVanId(String(data.vans[0].id));
      });
  }, []);

  const loadItems = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/inventory?van=${id}`);
    const data = await res.json();
    setItems(data.items || []);
    setSessionDeltas({});
    setLoading(false);
  }, []);

  useEffect(() => {
    if (vanId && tab === 'adjust') loadItems(vanId);
  }, [vanId, tab, loadItems]);

  function adjust(itemId, dir) {
    setSessionDeltas((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + dir,
    }));
  }

  async function handleSubmit() {
    const changes = Object.entries(sessionDeltas)
      .filter(([, delta]) => delta !== 0)
      .map(([itemId, delta]) => ({ itemId: Number(itemId), delta }));

    if (changes.length === 0) {
      setToast('No changes to submit.');
      setTimeout(() => setToast(''), 2000);
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/inventory/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vanId: Number(vanId), changes }),
    });
    setSubmitting(false);

    if (res.ok) {
      setToast('Changes submitted.');
      loadItems(vanId);
    } else {
      setToast('Submit failed. Try again.');
    }
    setTimeout(() => setToast(''), 2500);
  }

  async function handleLogout() {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'im' }),
    });
    router.push('/');
    router.refresh();
  }

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, query]);

  const changeCount = Object.values(sessionDeltas).filter((d) => d !== 0).length;

  return (
    <main className="min-h-screen bg-navy-50 pb-28">
      <header className="bg-navy-900 text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/50 uppercase">01 · Inventory Management</p>
            <h1 className="font-display text-lg font-semibold">Van Stock</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-white/60 hover:text-white border border-white/20 rounded-full px-3 py-1.5"
          >
            Log out
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-5 pb-3 flex gap-3">
          <select
            value={vanId}
            onChange={(e) => setVanId(e.target.value)}
            className="flex-1 rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember [&>option]:text-navy-900"
          >
            {vans.map((v) => (
              <option key={v.id} value={v.id}>
                {v.locationName} · {v.code}
              </option>
            ))}
          </select>
        </div>
        <div className="max-w-2xl mx-auto px-5 pb-3 flex gap-2 flex-wrap">
          <a
            href={`/audit?van=${vanId}&from=im`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white/10 border border-white/20 text-white rounded-full px-3 py-1.5 hover:bg-white/20 transition whitespace-nowrap"
          >
            Print Audit Sheet
          </a>
          <button
            onClick={() => setMultiOpen(true)}
            className="text-xs bg-white/10 border border-white/20 text-white rounded-full px-3 py-1.5 hover:bg-white/20 transition whitespace-nowrap"
          >
            Print Multiple Audit Sheets
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-5 flex gap-1 text-sm">
          <ImTabButton active={tab === 'adjust'} onClick={() => setTab('adjust')}>
            Adjust Stock
          </ImTabButton>
          <ImTabButton active={tab === 'history'} onClick={() => setTab('history')}>
            History
          </ImTabButton>
          <ImTabButton active={tab === 'allSummary'} onClick={() => setTab('allSummary')}>
            All Van Summary
          </ImTabButton>
        </div>
      </header>

      {tab === 'adjust' ? (
        <AdjustTab
          query={query}
          setQuery={setQuery}
          loading={loading}
          filteredItems={filteredItems}
          sessionDeltas={sessionDeltas}
          adjust={adjust}
          toast={toast}
          submitting={submitting}
          changeCount={changeCount}
          handleSubmit={handleSubmit}
        />
      ) : tab === 'history' ? (
        <HistoryTab vanId={vanId} />
      ) : (
        <AllVanSummaryTab />
      )}

      {multiOpen && (
        <MultiPrintModal vans={vans} from="im" onClose={() => setMultiOpen(false)} />
      )}
    </main>
  );
}

function ImTabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 border-b-2 transition ${
        active ? 'border-ember-600 text-white' : 'border-transparent text-white/50 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  );
}

function MultiPrintModal({ vans, from, onClose }) {
  const [selected, setSelected] = useState(() => new Set(vans.map((v) => v.id)));

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(vans.map((v) => v.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function handlePrint() {
    const ids = Array.from(selected).join(',');
    window.open(`/audit/multi?vans=${ids}&from=${from}`, '_blank');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center px-6 z-30">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <h2 className="font-display text-lg font-semibold text-navy-900 mb-1">
          Print multiple audit sheets
        </h2>
        <p className="text-sm text-navy-900/60 mb-4">Choose which vans to include.</p>

        <div className="flex gap-3 mb-3 text-xs">
          <button onClick={selectAll} className="text-navy-900/60 hover:text-navy-900 underline">
            Select all
          </button>
          <button onClick={selectNone} className="text-navy-900/60 hover:text-navy-900 underline">
            Select none
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 mb-4 border border-navy-900/10 rounded-lg p-2">
          {vans.map((v) => (
            <label
              key={v.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.has(v.id)}
                onChange={() => toggle(v.id)}
                className="accent-ember-600"
              />
              <span className="text-navy-900">
                {v.locationName} · {v.code}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-navy-900/15 text-navy-900 font-medium py-2.5 hover:bg-navy-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={selected.size === 0}
            className="flex-1 rounded-lg bg-navy-900 text-white font-medium py-2.5 hover:bg-ember-600 transition disabled:opacity-40"
          >
            Print ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}

function AdjustTab({
  query,
  setQuery,
  loading,
  filteredItems,
  sessionDeltas,
  adjust,
  toast,
  submitting,
  changeCount,
  handleSubmit,
}) {
  return (
    <>
      <div className="max-w-2xl mx-auto px-5 pt-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter items..."
          className="w-full rounded-lg border border-navy-900/15 bg-white px-4 py-2.5 text-sm mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
        />

        {loading ? (
          <p className="text-center text-navy-900/40 py-10 text-sm">Loading...</p>
        ) : (
          <ul className="space-y-2">
            {filteredItems.map((it) => {
              const delta = sessionDeltas[it.itemId] || 0;
              const displayQty = it.current + delta;
              return (
                <li
                  key={it.itemId}
                  className="bg-white rounded-xl border border-navy-900/10 px-4 py-3 flex items-center gap-3"
                >
                  <span className="font-mono text-lg font-semibold text-navy-900 w-8 text-center tabular-nums">
                    {displayQty}
                  </span>
                  <div className="flex flex-col">
                    <button
                      aria-label={`Increase ${it.name}`}
                      onClick={() => adjust(it.itemId, 1)}
                      className="w-8 h-7 flex items-center justify-center rounded-t-md bg-navy-50 hover:bg-stock-up/10 active:bg-stock-up/20 text-navy-900/70"
                    >
                      <ArrowIcon dir="up" />
                    </button>
                    <button
                      aria-label={`Decrease ${it.name}`}
                      onClick={() => adjust(it.itemId, -1)}
                      className="w-8 h-7 flex items-center justify-center rounded-b-md bg-navy-50 hover:bg-stock-down/10 active:bg-stock-down/20 text-navy-900/70"
                    >
                      <ArrowIcon dir="down" />
                    </button>
                  </div>
                  <span className="flex-1 text-sm text-navy-900 leading-snug">{it.name}</span>
                  <span
                    className={`font-mono text-sm font-semibold w-10 text-right tabular-nums ${
                      delta > 0 ? 'text-stock-up' : delta < 0 ? 'text-stock-down' : 'text-transparent'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta < 0 ? delta : '0'}
                  </span>
                </li>
              );
            })}
            {filteredItems.length === 0 && (
              <p className="text-center text-navy-900/40 py-10 text-sm">No items match.</p>
            )}
          </ul>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-navy-900/10 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {toast && <span className="text-xs text-navy-900/60 flex-1">{toast}</span>}
          <button
            onClick={handleSubmit}
            disabled={submitting || changeCount === 0}
            className="ml-auto rounded-lg bg-ember-600 text-white font-medium px-6 py-3 hover:bg-ember-700 transition disabled:opacity-30"
          >
            {submitting ? 'Submitting...' : `Submit changes${changeCount ? ` (${changeCount})` : ''}`}
          </button>
        </div>
      </div>
    </>
  );
}

function ArrowIcon({ dir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      {dir === 'up' ? (
        <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function HistoryTab({ vanId }) {
  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const [start, setStart] = useState(toDateInputValue(weekAgo));
  const [end, setEnd] = useState(toDateInputValue(today));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    if (!vanId) return;
    setLoading(true);
    setError('');
    const res = await fetch(`/api/inventory/history?van=${vanId}&start=${start}&end=${end}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setItems(data.items || []);
    } else {
      setError(data.error || 'Something went wrong loading history.');
    }
    setLoading(false);
  }, [vanId, start, end]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-5 pb-10">
      <div className="bg-white rounded-xl border border-navy-900/10 p-4 mb-4 flex gap-3">
        <label className="flex-1 text-xs text-navy-900/60">
          Start
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            max={end}
            className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
          />
        </label>
        <label className="flex-1 text-xs text-navy-900/60">
          End
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            min={start}
            max={toDateInputValue(today)}
            className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
          />
        </label>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter items..."
        className="w-full rounded-lg border border-navy-900/15 bg-white px-4 py-2.5 text-sm mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
      />

      {loading ? (
        <p className="text-center text-navy-900/40 py-10 text-sm">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600 py-10 text-sm">{error}</p>
      ) : (
        <ul className="space-y-2">
          {filteredItems.map((it) => (
            <li
              key={it.itemId}
              className="bg-white rounded-xl border border-navy-900/10 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-semibold text-navy-900 w-8 text-center tabular-nums">
                  {it.currentQty}
                </span>
                <span className="flex-1 text-sm text-navy-900 leading-snug">{it.name}</span>
                <span className="text-[11px] font-mono text-navy-900/40">#{it.invCode}</span>
              </div>
              {it.history.length > 0 && (
                <ul className="mt-2 pt-2 border-t border-navy-900/5 space-y-1">
                  {it.history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="text-navy-900/40 font-mono">
                        {new Date(h.completedAt).toLocaleString()}
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          h.delta > 0 ? 'text-stock-up' : 'text-stock-down'
                        }`}
                      >
                        {h.delta > 0 ? `+${h.delta}` : h.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-center text-navy-900/40 py-10 text-sm">No items match.</p>
          )}
        </ul>
      )}
    </div>
  );
}

function AllVanSummaryTab() {
  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const [start, setStart] = useState(toDateInputValue(weekAgo));
  const [end, setEnd] = useState(toDateInputValue(today));
  const [vans, setVans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/inventory/all-summary?start=${start}&end=${end}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setVans(data.vans || []);
    } else {
      setError(data.error || 'Something went wrong loading the summary.');
    }
    setLoading(false);
  }, [start, end]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-5 pb-10">
      <p className="text-sm text-navy-900/60 mb-5 leading-relaxed">
        Current stock and what moved for every van in the date range below. Only items with
        activity in that range are shown.
      </p>

      <div className="bg-white rounded-xl border border-navy-900/10 p-4 mb-6 flex gap-3">
        <label className="flex-1 text-xs text-navy-900/60">
          Start
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            max={end}
            className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
          />
        </label>
        <label className="flex-1 text-xs text-navy-900/60">
          End
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            min={start}
            max={toDateInputValue(today)}
            className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-center text-navy-900/40 py-10 text-sm">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600 py-10 text-sm">{error}</p>
      ) : vans.length === 0 ? (
        <p className="text-center text-navy-900/40 py-10 text-sm">
          No activity across any van in this date range.
        </p>
      ) : (
        <div className="space-y-4">
          {vans.map((van) => (
            <div key={van.vanId} className="bg-white rounded-xl border border-navy-900/10 p-4">
              <p className="font-display font-semibold text-navy-900 text-sm mb-2">
                {van.locationName} · {van.code}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-navy-900/40 uppercase tracking-wide">
                    <th className="text-left font-medium pb-1">Item</th>
                    <th className="text-right font-medium pb-1 w-16">Stock</th>
                    <th className="text-right font-medium pb-1 w-16">Added</th>
                    <th className="text-right font-medium pb-1 w-16">Removed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-900/5">
                  {van.items.map((it) => (
                    <tr key={it.itemId}>
                      <td className="py-1.5 pr-2">
                        <p className="text-navy-900 leading-snug">{it.name}</p>
                        <p className="text-[11px] font-mono text-navy-900/40">#{it.invCode}</p>
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-navy-900">
                        {it.currentQty}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-stock-up">
                        {it.added > 0 ? `+${it.added}` : '-'}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-stock-down">
                        {it.removed > 0 ? `-${it.removed}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
