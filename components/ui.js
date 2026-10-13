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

export function MinusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 13H5v-2h14v2z" />
    </svg>
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

export function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
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
