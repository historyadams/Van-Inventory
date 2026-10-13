'use client';

import { useMemo } from 'react';

export function CogIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54A.48.48 0 0 0 13.92 2h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.72 8.47a.48.48 0 0 0 .12.61l2.03 1.58c-.05.31-.07.63-.07.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
    </svg>
  );
}

export function PlusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function MinusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 13H5v-2h14v2z" />
    </svg>
  );
}

// Item code, shown in yellow when another item shares the same code so it
// can be double-checked.
export function CodeTag({ code, dup }) {
  if (!dup) return <span>#{code}</span>;
  return (
    <span className="font-semibold" style={{ color: '#FACC15' }} title="Another item shares this code">
      #{code}
    </span>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`tile-btn !px-2 ${active === t.key ? 'is-active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// YYYY-MM-DD in the viewer's local time (toISOString would give the UTC date,
// which rolls over to tomorrow in the evening in California).
export function toDateInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Start/end date pickers defaulting to the last 7 days.
export function useDefaultRange() {
  return useMemo(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { today: toDateInputValue(today), weekAgo: toDateInputValue(weekAgo) };
  }, []);
}

export function DateRange({ start, end, setStart, setEnd, max }) {
  return (
    <div className="flex gap-3">
      <label className="flex-1 text-xs text-muted">
        Start
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          max={end}
          className="input mt-1"
        />
      </label>
      <label className="flex-1 text-xs text-muted">
        End
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          min={start}
          max={max}
          className="input mt-1"
        />
      </label>
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="text-center text-dim py-10 text-sm">{children}</p>;
}

// Category filter buttons: "All" plus one per category, multi-select.
// `selected` is a Set of category keys (empty = All), `counts` maps category
// key -> item count (pass search-match counts while searching), `shown` is how
// many items the list is showing. While searching, every item is searched, so
// the category buttons are dimmed and the status line says so; tapping one
// clears the search.
export function CategoryFilters({ categories, selected, onChange, counts = {}, shown, searching, onClearSearch }) {
  // Tapping any button while searching clears the search so the tap takes effect.
  function pick(next) {
    if (searching && onClearSearch) onClearSearch();
    onChange(next);
  }
  function toggle(key) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    pick(next);
  }
  const allOn = selected.size === 0;
  const btn = 'tile-btn !h-10 !px-2 !text-[12px]';
  const plural = shown === 1 ? '' : 's';

  let status;
  if (searching) status = `${shown} match${shown === 1 ? '' : 'es'} across all items`;
  else if (allOn) status = `Showing ${shown} item${plural} · Atypical hidden (tap it to show)`;
  else
    status = `Showing ${shown} item${plural} in ${categories
      .filter((c) => selected.has(c.key))
      .map((c) => c.label)
      .join(', ')}`;

  return (
    <div>
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 transition-opacity ${searching ? 'opacity-40' : ''}`}>
        <button onClick={() => pick(new Set())} aria-pressed={allOn} className={`${btn} ${allOn ? 'is-on' : ''}`}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => toggle(c.key)}
            aria-pressed={selected.has(c.key)}
            className={`${btn} ${selected.has(c.key) ? 'is-on' : ''}`}
          >
            {c.label}
            <span className="opacity-60 tabular-nums">· {counts[c.key] || 0}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-dim">{status}</p>
    </div>
  );
}

// Small heading that starts each category section in a grouped item list.
export function CategoryHeading({ label, count }) {
  return (
    <li className="pt-3 first:pt-0 pb-1">
      <p className="section-title">
        {label} <span className="opacity-60">· {count}</span>
      </p>
    </li>
  );
}
