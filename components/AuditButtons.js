'use client';

import { useState } from 'react';

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
    </svg>
  );
}

// "Print Audit Sheet" for the selected van plus "Print Multiple" with a van
// picker. `from` is 'im' or 'sc' so the sheet's Back link returns to the
// right page.
export function AuditButtons({ vans, vanId, from }) {
  const [multiOpen, setMultiOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`/audit?van=${vanId}&from=${from}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tile-btn"
        >
          <PrintIcon />
          Print Audit Sheet
        </a>
        <button onClick={() => setMultiOpen(true)} className="tile-btn">
          <PrintIcon />
          Print Multiple
        </button>
      </div>
      {multiOpen && <MultiPrintModal vans={vans} from={from} onClose={() => setMultiOpen(false)} />}
    </>
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

  function handlePrint() {
    const ids = Array.from(selected).join(',');
    window.open(`/audit/multi?vans=${ids}&from=${from}`, '_blank');
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-1">Print multiple audit sheets</h2>
        <p className="text-sm text-muted mb-4">Choose which vans to include.</p>

        <div className="flex gap-3 mb-3 text-xs">
          <button onClick={() => setSelected(new Set(vans.map((v) => v.id)))} className="text-muted hover:text-white underline">
            Select all
          </button>
          <button onClick={() => setSelected(new Set())} className="text-muted hover:text-white underline">
            Select none
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 mb-4 tile p-2">
          {vans.map((v) => (
            <label
              key={v.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.has(v.id)}
                onChange={() => toggle(v.id)}
                className="accent-[#EF4023]"
              />
              <span className="text-white">
                {v.locationName} · {v.code}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={handlePrint} disabled={selected.size === 0} className="btn-primary flex-1">
            Print ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
