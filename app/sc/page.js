'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, SyncStatus, LogoutButton } from '../../components/TopBar';
import { AuditButtons } from '../../components/AuditButtons';
import { Tabs, Toast, DateRange, EmptyState, useDefaultRange, CodeTag } from '../../components/ui';

const LOCATIONS = [
  { prefix: 'AH', name: 'Agoura Hills' },
  { prefix: 'NC', name: 'Nor Cal' },
  { prefix: 'SD', name: 'San Diego' },
];

const TABS = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'locations', label: 'Locations' },
  { key: 'items', label: 'Items' },
  { key: 'reports', label: 'Reports' },
];

const POLL_MS = 4000;

export default function ScPage() {
  const router = useRouter();
  const [tab, setTab] = useState('incoming');
  const [vans, setVans] = useState([]);
  const [vanId, setVanId] = useState('');

  const refreshVans = useCallback(async () => {
    const res = await fetch('/api/vans');
    const data = await res.json().catch(() => ({}));
    setVans(data.vans || []);
    return data.vans || [];
  }, []);

  useEffect(() => {
    refreshVans().then((v) => {
      // Start on the first van that has something waiting, if any.
      const first = v.find((van) => van.pendingItems > 0) || v[0];
      if (first) setVanId(String(first.id));
    });
  }, [refreshVans]);

  async function handleLogout() {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'sc' }),
    });
    router.push('/');
    router.refresh();
  }

  return (
    <main className="min-h-screen pb-16">
      <TopBar
        right={
          <>
            <SyncStatus />
            <LogoutButton onClick={handleLogout} />
          </>
        }
      />

      <div className="max-w-[1040px] mx-auto px-4 pt-5">
        <div className="panel px-4 sm:px-7 pt-4 pb-5">
          <p className="section-title mb-3">Supply Chain</p>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <div className="divider my-4" />

          {tab === 'incoming' ? (
            <IncomingTab vans={vans} vanId={vanId} setVanId={setVanId} refreshVans={refreshVans} />
          ) : tab === 'locations' ? (
            <LocationsTab vans={vans} onChanged={refreshVans} />
          ) : tab === 'items' ? (
            <ItemsTab />
          ) : (
            <ReportsTab />
          )}
        </div>
      </div>
    </main>
  );
}

function IncomingTab({ vans, vanId, setVanId, refreshVans }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState('');
  const [allOpen, setAllOpen] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
  const router = useRouter();

  const loadItems = useCallback(async (id, opts) => {
    const silent = opts && opts.silent;
    if (!id) return;
    if (!silent) setLoading(true);
    const res = await fetch(`/api/inventory?van=${id}`);
    const data = await res.json().catch(() => ({}));
    setItems(data.items || []);
    setLastSynced(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    if (!vanId) return;
    loadItems(vanId);
    const interval = setInterval(() => {
      loadItems(vanId, { silent: true });
      refreshVans();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [vanId, loadItems, refreshVans]);

  async function handleCompleteConfirmed() {
    setCompleting(true);
    const res = await fetch('/api/inventory/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vanId: Number(vanId) }),
    });
    setCompleting(false);
    setConfirmOpen(false);
    setToast(res.ok ? 'Update completed.' : 'Something went wrong. Try again.');
    setTimeout(() => setToast(''), 2500);
    if (res.ok) {
      loadItems(vanId);
      refreshVans();
    }
  }

  // Confirms every van at once, then opens a printable summary of exactly
  // what was just confirmed.
  async function handleCompleteAllConfirmed() {
    setCompletingAll(true);
    const res = await fetch('/api/inventory/complete-all', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setCompletingAll(false);
    setAllOpen(false);
    if (res.ok && data.batchAt) {
      router.push(`/sc/summary?at=${encodeURIComponent(data.batchAt)}`);
    } else {
      setToast(res.ok ? 'Nothing was waiting.' : 'Something went wrong. Try again.');
      setTimeout(() => setToast(''), 2500);
      refreshVans();
      loadItems(vanId);
    }
  }

  const pendingItems = items.filter((it) => it.pending > 0);
  const pendingUnits = pendingItems.reduce((s, it) => s + it.pending, 0);
  const vansWaiting = vans.filter((v) => v.pendingItems > 0).length;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm text-muted">
          {vansWaiting === 0
            ? 'No vans waiting on confirmation.'
            : `${vansWaiting} van${vansWaiting === 1 ? '' : 's'} waiting on confirmation.`}
        </p>
        {lastSynced && <p className="text-[11px] text-dim shrink-0">live as of {lastSynced.toLocaleTimeString()}</p>}
      </div>

      <button onClick={() => setAllOpen(true)} disabled={vansWaiting === 0} className="tile-hero mb-4">
        Update all vans{vansWaiting ? ` (${vansWaiting} waiting)` : ''} &amp; print summary
      </button>

      <select value={vanId} onChange={(e) => setVanId(e.target.value)} aria-label="Van" className="input mb-2">
        {vans.map((v) => (
          <option key={v.id} value={v.id}>
            {v.locationName} · {v.code}
            {v.pendingItems > 0 ? `  (${v.pendingItems} waiting)` : ''}
          </option>
        ))}
      </select>
      <div className="mb-4">
        <AuditButtons vans={vans} vanId={vanId} from="sc" />
      </div>

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : pendingItems.length === 0 ? (
        <EmptyState>Nothing waiting for this van.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {pendingItems.map((it) => (
            <li key={it.itemId} className="tile px-3 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-snug">{it.name}</p>
                <p className="text-[11px] text-dim">
                  <CodeTag code={it.invCode} dup={it.dupCode} />
                </p>
              </div>
              <span className="text-lg font-bold tabular-nums text-synced animate-flash">+{it.pending}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <button onClick={() => setConfirmOpen(true)} disabled={pendingItems.length === 0} className="tile-hero">
          Update completed
          {pendingItems.length
            ? ` (${pendingUnits} unit${pendingUnits === 1 ? '' : 's'}, ${pendingItems.length} item${
                pendingItems.length === 1 ? '' : 's'
              })`
            : ''}
        </button>
      </div>

      {allOpen && (
        <ConfirmModal
          title="Update all vans?"
          body={`This logs every pending addition on all ${vansWaiting} waiting van${vansWaiting === 1 ? '' : 's'} as loaded and clears them, then shows a printable summary. This cannot be undone.`}
          confirmLabel={completingAll ? 'Updating...' : 'Yes, update all'}
          loading={completingAll}
          onCancel={() => setAllOpen(false)}
          onConfirm={handleCompleteAllConfirmed}
        />
      )}
      {confirmOpen && (
        <ConfirmModal
          title="Are you sure?"
          body="This logs every addition shown right now as loaded into this van and clears the list. This cannot be undone."
          confirmLabel={completing ? 'Updating...' : 'Yes, update'}
          loading={completing}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleCompleteConfirmed}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

function ConfirmModal({ title, body, confirmLabel, loading, onCancel, onConfirm, danger }) {
  return (
    <div className="modal-backdrop">
      <div className="card max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-sm text-muted mt-2 leading-relaxed">{body}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`}>
            {confirmLabel}
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
    <>
      <p className="text-sm text-muted mb-4 leading-relaxed">
        Drag a van&apos;s code into the location it&apos;s actually parked at. This updates its first two letters
        everywhere it&apos;s shown.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        {LOCATIONS.map((loc) => {
          const vansHere = vans.filter((v) => v.prefix === loc.prefix);
          const isOver = overPrefix === loc.prefix;
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
              className="rounded-[10px] border-2 border-dashed p-4 min-h-[160px] transition"
              style={{
                borderColor: isOver ? 'rgba(239,64,35,0.6)' : 'var(--line)',
                background: isOver ? 'rgba(239,64,35,0.08)' : 'var(--tile)',
              }}
            >
              <p className="font-bold text-white">{loc.name}</p>
              <p className="section-title mb-3 mt-0.5">{loc.prefix}</p>
              <div className="flex flex-wrap gap-2">
                {vansHere.map((v) => (
                  <div
                    key={v.suffix}
                    draggable
                    onDragStart={() => setDragSuffix(v.suffix)}
                    onDragEnd={() => setDragSuffix(null)}
                    className={`tile-btn !h-9 cursor-grab active:cursor-grabbing select-none ${
                      dragSuffix === v.suffix ? 'opacity-40' : ''
                    }`}
                  >
                    {v.suffix}
                  </div>
                ))}
                {vansHere.length === 0 && <p className="text-xs text-dim italic">Drop a van here</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Toast message={toast} />
    </>
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
  const [dupPrompt, setDupPrompt] = useState(null); // { code, existingNames }

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/items');
    const data = await res.json().catch(() => ({}));
    setItems(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  // First attempt never creates a shared code silently: the server answers
  // `duplicate: true` and we ask before resending with confirmDuplicate.
  async function addItem(confirmDuplicate) {
    setError('');
    setSaving(true);
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, invCode, confirmDuplicate }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setDupPrompt(null);

    if (res.ok) {
      showToast(`Added "${name.trim()}".`);
      setName('');
      setInvCode('');
      loadItems();
    } else if (data.duplicate) {
      setDupPrompt(data);
    } else {
      setError(data.error || 'Something went wrong. Try again.');
    }
  }

  function handleAdd(e) {
    e.preventDefault();
    addItem(false);
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
    showToast(res.ok ? `Removed "${deleteTarget.name}".` : 'Something went wrong. Try again.');
    setDeleteTarget(null);
    if (res.ok) loadItems();
  }

  const filteredItems = items.filter((it) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return it.name.toLowerCase().includes(q) || String(it.invCode).includes(q);
  });

  return (
    <>
      <p className="text-sm text-muted mb-4 leading-relaxed">
        Add a new item so it can be loaded into any van, or remove one that&apos;s no longer stocked.
      </p>

      <form onSubmit={handleAdd} className="tile p-4 mb-5 space-y-3">
        <p className="section-title">Add new item</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name, e.g. Cyberpower Battery Backup"
            required
            className="input flex-1"
          />
          <input
            type="number"
            value={invCode}
            onChange={(e) => setInvCode(e.target.value)}
            placeholder="Inv code"
            required
            className="input sm:!w-32"
          />
        </div>
        {error && <p className="text-xs text-primary">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Adding...' : 'Add item'}
        </button>
      </form>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter items or code..."
        className="input mb-3"
      />

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : (
        <ul className="space-y-2">
          {filteredItems.map((it) => (
            <li key={it.itemId} className="tile px-3 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-snug">{it.name}</p>
                <p className="text-[11px] text-dim">
                  <CodeTag code={it.invCode} dup={it.dupCode} />
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(it)}
                className="text-xs font-semibold text-primary border border-primary/40 rounded-full px-3 py-1.5 hover:bg-primary/10 transition"
              >
                Remove
              </button>
            </li>
          ))}
          {filteredItems.length === 0 && <EmptyState>No items match.</EmptyState>}
        </ul>
      )}

      {deleteTarget && (
        <ConfirmModal
          danger
          title="Remove this item?"
          body={`"${deleteTarget.name}" will be removed from the catalog along with its load history. This cannot be undone.`}
          confirmLabel={deleting ? 'Removing...' : 'Yes, remove'}
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}
      {dupPrompt && (
        <ConfirmModal
          title="Duplicate item number"
          body={`#${dupPrompt.code} is already used by ${dupPrompt.existingNames
            .map((n) => `"${n}"`)
            .join(', ')}. You are about to create a duplicate item number. Do you wish to continue? Shared numbers show in yellow.`}
          confirmLabel={saving ? 'Adding...' : 'Yes, continue'}
          loading={saving}
          onCancel={() => setDupPrompt(null)}
          onConfirm={() => addItem(true)}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

function ReportsTab() {
  const { today, weekAgo } = useDefaultRange();
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(today);
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
    if (res.ok) setSummary(data.vans || []);
    else setError(data.error || 'Something went wrong loading the summary.');
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

  const totalMoves = useMemo(() => summary.reduce((sum, v) => sum + v.moves.length, 0), [summary]);

  return (
    <>
      <p className="text-sm text-muted mb-4 leading-relaxed">
        Pick a date range to see what was loaded into each van, and export it as a CSV for your records.
      </p>

      <div className="tile p-4 mb-5 space-y-3">
        <DateRange start={start} end={end} setStart={setStart} setEnd={setEnd} max={today} />
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-dim">
            {lastExportedAt ? `Last exported ${new Date(lastExportedAt).toLocaleString()}` : 'No exports yet'}
          </p>
          <button onClick={handleExport} disabled={exporting} className="btn-primary whitespace-nowrap">
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <p className="section-title mb-3">
        Summary {totalMoves > 0 && !loading ? `· ${totalMoves} transfer${totalMoves === 1 ? '' : 's'}` : ''}
      </p>

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : error ? (
        <EmptyState>{error}</EmptyState>
      ) : summary.length === 0 ? (
        <EmptyState>Nothing was loaded into any van in this date range.</EmptyState>
      ) : (
        <div className="space-y-3">
          {summary.map((van) => (
            <div key={van.vanId} className="tile p-3">
              <p className="text-sm font-bold text-white">
                {van.locationName} · {van.code}
              </p>
              <ul className="divide-y divide-white/5 mt-2">
                {van.moves.map((m, i) => (
                  <li key={i} className="py-2 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-snug">{m.name}</p>
                      <p className="text-[11px] text-dim">
                        #{m.invCode} · {new Date(m.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-synced whitespace-nowrap">+{m.delta}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
