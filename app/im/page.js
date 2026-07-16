'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ImPage() {
  const router = useRouter();
  const [vans, setVans] = useState([]);
  const [vanId, setVanId] = useState('');
  const [items, setItems] = useState([]);
  const [sessionDeltas, setSessionDeltas] = useState({}); // itemId -> delta
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

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
    if (vanId) loadItems(vanId);
  }, [vanId, loadItems]);

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
    await fetch('/api/logout', { method: 'POST' });
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
        <div className="max-w-2xl mx-auto px-5 pb-4 flex gap-3">
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
      </header>

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
    </main>
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
