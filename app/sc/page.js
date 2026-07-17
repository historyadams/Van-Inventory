'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const LOCATIONS = [
  { prefix: 'AH', name: 'Agoura Hills' },
  { prefix: 'NC', name: 'Nor Cal' },
  { prefix: 'SD', name: 'San Diego' },
];

const POLL_MS = 4000;

export default function ScPage() {
  const router = useRouter();
  const [tab, setTab] = useState('inventory'); // 'inventory' | 'locations' | 'items' | 'reports'
  const [vans, setVans] = useState([]);
  const [vanId, setVanId] = useState('');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState('');
  const [lastSynced, setLastSynced] = useState(null);

  const refreshVans = useCallback(async () => {
    const res = await fetch('/api/vans');
    const data = await res.json();
    setVans(data.vans || []);
    return data.vans || [];
  }, []);

  useEffect(() => {
    refreshVans().then((v) => {
      if (v.length > 0) setVanId(String(v[0].id));
    });
  }, [refreshVans]);

  const loadItems = useCallback(async (id, opts) => {
    const silent = opts && opts.silent;
    if (!id) return;
    if (!silent) setLoading(true);
    const res = await fetch(`/api/inventory?van=${id}`);
    const data = await res.json();
    setItems(data.items || []);
    setLastSynced(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    if (!vanId || tab !== 'inventory') return;
    loadItems(vanId);
    const interval = setInterval(() => loadItems(vanId, { silent: true }), POLL_MS);
    return () => clearInterval(interval);
  }, [vanId, tab, loadItems]);

  async function handleLogout() {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'sc' }),
    });
    router.push('/');
    router.refresh();
  }

  async function handleCompleteConfirmed() {
    setCompleting(true);
    const res = await fetch('/api/inventory/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vanId: Number(vanId) }),
    });
    setCompleting(false);
    setConfirmOpen(false);
    if (res.ok) {
      setToast('Update completed.');
      loadItems(vanId);
    } else {
      setToast('Something went wrong. Try again.');
    }
    setTimeout(() => setToast(''), 2500);
  }

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((it) => it.name.toLowerCase().includes(q) || String(it.invCode).includes(q));
  }, [items, query]);

  const pendingCount = items.filter((it) => it.pendingDelta !== 0).length;

  return (
    <main className="min-h-screen bg-navy-50 pb-16">
      <header className="bg-navy-900 text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/50 uppercase">02 · Supply Chain</p>
            <h1 className="font-display text-lg font-semibold">Van Stock</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-white/60 hover:text-white border border-white/20 rounded-full px-3 py-1.5"
          >
            Log out
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-5 flex gap-1 text-sm">
          <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')}>
            Inventory
          </TabButton>
          <TabButton active={tab === 'locations'} onClick={() => setTab('locations')}>
            Van Locations
          </TabButton>
          <TabButton active={tab === 'items'} onClick={() => setTab('items')}>
            Manage Items
          </TabButton>
          <TabButton active={tab === 'reports'} onClick={() => setTab('reports')}>
            Reports
          </TabButton>
        </div>
      </header>

      {tab === 'inventory' ? (
        <InventoryTab
          vans={vans}
          vanId={vanId}
          setVanId={setVanId}
          items={filteredItems}
          query={query}
          setQuery={setQuery}
          loading={loading}
          pendingCount={pendingCount}
          lastSynced={lastSynced}
          onCompleteClick={() => setConfirmOpen(true)}
        />
      ) : tab === 'locations' ? (
        <LocationsTab vans={vans} onChanged={refreshVans} />
      ) : tab === 'items' ? (
        <ItemsTab />
      ) : (
        <ReportsTab />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {confirmOpen && (
        <ConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleCompleteConfirmed}
          loading={completing}
        />
      )}
    </main>
  );
}

function TabButton({ active, onClick, children }) {
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

function InventoryTab({
  vans,
  vanId,
  setVanId,
  items,
  query,
  setQuery,
  loading,
  pendingCount,
  lastSynced,
  onCompleteClick,
}) {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-5">
      <div className="flex gap-3 mb-4">
        <select
          value={vanId}
          onChange={(e) => setVanId(e.target.value)}
          className="flex-1 rounded-lg border border-navy-900/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
        >
          {vans.map((v) => (
            <option key={v.id} value={v.id}>
              {v.locationName} · {v.code}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter items or code..."
        className="w-full rounded-lg border border-navy-900/15 bg-white px-4 py-2.5 text-sm mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
      />

      {lastSynced && (
        <p className="text-[11px] text-navy-900/35 mb-3 font-mono">
          live as of {lastSynced.toLocaleTimeString()}
        </p>
      )}

      {loading ? (
        <p className="text-center text-navy-900/40 py-10 text-sm">Loading...</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.itemId}
              className="bg-white rounded-xl border border-navy-900/10 px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-900 leading-snug">{it.name}</p>
                <p className="text-[11px] font-mono text-navy-900/40">#{it.invCode}</p>
              </div>
              <span
                className={`font-mono text-sm font-semibold w-12 text-right tabular-nums ${
                  it.pendingDelta > 0 ? 'text-stock-up animate-flash' : 'text-transparent'
                }`}
              >
                {it.pendingDelta > 0 ? `+${it.pendingDelta}` : '0'}
              </span>
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-center text-navy-900/40 py-10 text-sm">No items match.</p>
          )}
        </ul>
      )}

      <div className="sticky bottom-0 mt-6 pb-6 pt-3 bg-gradient-to-t from-navy-50 via-navy-50">
        <button
          onClick={onCompleteClick}
          disabled={pendingCount === 0}
          className="w-full rounded-lg bg-navy-900 text-white font-medium py-3 hover:bg-ember-600 transition disabled:opacity-30"
        >
          Update completed{pendingCount ? ` (${pendingCount} item${pendingCount === 1 ? '' : 's'})` : ''}
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ onCancel, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center px-6 z-20">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <h2 className="font-display text-lg font-semibold text-navy-900">Are you sure?</h2>
        <p className="text-sm text-navy-900/60 mt-2 leading-relaxed">
          This will lock in every change shown right now and reset the pending numbers to zero.
          This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-navy-900/15 text-navy-900 font-medium py-2.5 hover:bg-navy-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-ember-600 text-white font-medium py-2.5 hover:bg-ember-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Yes, update'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationsTab({ vans, onChanged }) {
  const [dragSuffix, setDragSuffix] = useState(null);
  const [overPrefix, setOverPrefix] = useState(null);
  const [toast, setToast] = useState('');

  async function handleDrop(prefix) {
    setOverPrefix(null);
    if (!dragSuffix) return;
    const van = vans.find((v) => v.suffix === dragSuffix);
    if (!van || van.prefix === prefix) {
      setDragSuffix(null);
      return;
    }
    await fetch('/api/vans/relocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vanId: van.id, prefix }),
    });
    setDragSuffix(null);
    setToast(`${van.suffix} moved to ${LOCATIONS.find((l) => l.prefix === prefix)?.name}.`);
    setTimeout(() => setToast(''), 2200);
    onChanged();
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-5">
      <p className="text-sm text-navy-900/60 mb-5 leading-relaxed">
        Drag a van's code into the location it's actually parked at. This updates its first two
        letters everywhere it's shown.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {LOCATIONS.map((loc) => {
          const vansHere = vans.filter((v) => v.prefix === loc.prefix);
          return (
            <div
              key={loc.prefix}
              onDragOver={(e) => {
                e.preventDefault();
                setOverPrefix(loc.prefix);
              }}
              onDragLeave={() => setOverPrefix((p) => (p === loc.prefix ? null : p))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(loc.prefix);
              }}
              className={`rounded-2xl border-2 border-dashed p-4 min-h-[180px] transition ${
                overPrefix === loc.prefix
                  ? 'border-ember bg-ember-50'
                  : 'border-navy-900/15 bg-white'
              }`}
            >
              <p className="font-display font-semibold text-navy-900 mb-1">{loc.name}</p>
              <p className="font-mono text-[11px] text-navy-900/40 mb-3">{loc.prefix}</p>
              <div className="flex flex-wrap gap-2">
                {vansHere.map((v) => (
                  <div
                    key={v.suffix}
                    draggable
                    onDragStart={() => setDragSuffix(v.suffix)}
                    onDragEnd={() => setDragSuffix(null)}
                    className={`font-mono text-sm px-3 py-1.5 rounded-lg border border-navy-900/15 bg-navy-50 cursor-grab active:cursor-grabbing select-none ${
                      dragSuffix === v.suffix ? 'opacity-40' : ''
                    }`}
                  >
                    {v.suffix}
                  </div>
                ))}
                {vansHere.length === 0 && (
                  <p className="text-xs text-navy-900/30 italic">Drop a van here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function ItemsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [invCode, setInvCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, invCode }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (res.ok) {
      setName('');
      setInvCode('');
      setToast(`Added "${name.trim()}" to every van.`);
      setTimeout(() => setToast(''), 2500);
      loadItems();
    } else {
      setError(data.error || 'Something went wrong. Try again.');
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch('/api/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: deleteTarget.itemId }),
    });
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      setToast(`Removed "${deleteTarget.name}."`);
      setTimeout(() => setToast(''), 2500);
      loadItems();
    } else {
      setToast('Something went wrong. Try again.');
      setTimeout(() => setToast(''), 2500);
    }
  }

  const filteredItems = items.filter((it) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return it.name.toLowerCase().includes(q) || String(it.invCode).includes(q);
  });

  return (
    <div className="max-w-2xl mx-auto px-5 pt-5">
      <p className="text-sm text-navy-900/60 mb-5 leading-relaxed">
        Add a new item to track across every van, or remove one that's no longer stocked.
        Adding an item creates a zeroed row for it on all 9 vans right away.
      </p>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-xl border border-navy-900/10 p-4 mb-6 space-y-3"
      >
        <h2 className="font-display font-semibold text-navy-900 text-sm">Add new item</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name, e.g. Cyberpower Battery Backup"
            required
            className="flex-1 rounded-lg border border-navy-900/15 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
          />
          <input
            type="number"
            value={invCode}
            onChange={(e) => setInvCode(e.target.value)}
            placeholder="Inv code"
            required
            className="w-28 rounded-lg border border-navy-900/15 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-navy-900 text-white text-sm font-medium px-4 py-2 hover:bg-ember-600 transition disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add item'}
        </button>
      </form>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter items or code..."
        className="w-full rounded-lg border border-navy-900/15 bg-white px-4 py-2.5 text-sm mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
      />

      {loading ? (
        <p className="text-center text-navy-900/40 py-10 text-sm">Loading...</p>
      ) : (
        <ul className="space-y-2 pb-10">
          {filteredItems.map((it) => (
            <li
              key={it.itemId}
              className="bg-white rounded-xl border border-navy-900/10 px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-900 leading-snug">{it.name}</p>
                <p className="text-[11px] font-mono text-navy-900/40">#{it.invCode}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(it)}
                className="text-xs text-red-600 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-center text-navy-900/40 py-10 text-sm">No items match.</p>
          )}
        </ul>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center px-6 z-20">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-navy-900">Remove this item?</h2>
            <p className="text-sm text-navy-900/60 mt-2 leading-relaxed">
              "{deleteTarget.name}" will be removed from every van's inventory and its history.
              This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-navy-900/15 text-navy-900 font-medium py-2.5 hover:bg-navy-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 text-white font-medium py-2.5 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function ReportsTab() {
  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const [start, setStart] = useState(toDateInputValue(weekAgo));
  const [end, setEnd] = useState(toDateInputValue(today));
  const [lastExportedAt, setLastExportedAt] = useState(null);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadLastExport = useCallback(async () => {
    const res = await fetch('/api/reports/last-export');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setLastExportedAt(data.lastExportedAt);
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/reports/summary?start=${start}&end=${end}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSummary(data.vans || []);
    } else {
      setError(data.error || 'Something went wrong loading the summary.');
    }
    setLoading(false);
  }, [start, end]);

  useEffect(() => {
    loadLastExport();
  }, [loadLastExport]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  function handleExport() {
    setExporting(true);
    window.location.href = `/api/reports/export?start=${start}&end=${end}`;
    // The browser download starts immediately; refresh the "last exported" stamp
    // shortly after, since the export route records it server-side as it runs.
    setTimeout(() => {
      loadLastExport();
      setExporting(false);
    }, 1200);
  }

  const totalMoves = summary.reduce((sum, v) => sum + v.moves.length, 0);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-5 pb-10">
      <p className="text-sm text-navy-900/60 mb-5 leading-relaxed">
        Pick a date range to see what moved into each van, and export it as a CSV for your
        records.
      </p>

      <div className="bg-white rounded-xl border border-navy-900/10 p-4 mb-6 space-y-3">
        <div className="flex gap-3">
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

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-navy-900/40 font-mono">
            {lastExportedAt
              ? `Last exported ${new Date(lastExportedAt).toLocaleString()}`
              : 'No exports yet'}
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg bg-navy-900 text-white text-sm font-medium px-4 py-2 hover:bg-ember-600 transition disabled:opacity-50 whitespace-nowrap"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <h2 className="font-display font-semibold text-navy-900 text-sm mb-3">
        Summary {totalMoves > 0 && !loading ? `(${totalMoves} transfer${totalMoves === 1 ? '' : 's'})` : ''}
      </h2>

      {loading ? (
        <p className="text-center text-navy-900/40 py-10 text-sm">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600 py-10 text-sm">{error}</p>
      ) : summary.length === 0 ? (
        <p className="text-center text-navy-900/40 py-10 text-sm">
          No transfers moved into any van in this date range.
        </p>
      ) : (
        <div className="space-y-4">
          {summary.map((van) => (
            <div key={van.vanId} className="bg-white rounded-xl border border-navy-900/10 p-4">
              <p className="font-display font-semibold text-navy-900 text-sm mb-1">
                {van.locationName} · {van.code}
              </p>
              <ul className="divide-y divide-navy-900/5 mt-2">
                {van.moves.map((m, i) => (
                  <li key={i} className="py-2 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-navy-900 leading-snug">{m.name}</p>
                      <p className="text-[11px] font-mono text-navy-900/40">
                        #{m.invCode} · {new Date(m.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-stock-up whitespace-nowrap">
                      +{m.delta}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
