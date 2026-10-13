// Blank count sheet for one van: every catalog item with an empty box for the
// technician to write what's actually in the van. Always printed on white.
export function AuditSheet({ van, items, today, pageBreakAfter }) {
  const half = Math.ceil(items.length / 2);
  const firstHalf = items.slice(0, half);
  const secondHalf = items.slice(half);

  return (
    <div
      className={`bg-white text-black rounded-[18px] p-8 print:rounded-none print:p-0 ${
        pageBreakAfter ? 'print:break-after-page' : ''
      }`}
    >
      <div
        className="flex items-center justify-between rounded-[10px] px-4 py-2.5 mb-4 print:mb-3"
        style={{ background: '#0A0A0B', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pos360-logo.png" alt="POS360" className="h-8 w-auto" />
        <div className="text-right leading-none">
          <p className="text-[13px] font-extrabold tracking-[0.14em] uppercase text-white">Van Audit Sheet</p>
          <p className="text-[8px] font-semibold tracking-[0.3em] uppercase mt-1" style={{ color: '#EF4023' }}>
            Supply Chain Ops
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4 print:mb-3 text-sm">
        <Field label="Van">
          <p className="font-bold">{van ? van.code : '-'}</p>
        </Field>
        <Field label="Location">
          <p className="font-bold">{van ? van.locationName : '-'}</p>
        </Field>
        <Field label="Technician (print name)">
          <div className="border-b border-black/40 h-6" />
        </Field>
        <Field label="Date completed">
          <div className="border-b border-black/40 h-6" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-6 print:gap-4">
        <ItemTable items={firstHalf} />
        <ItemTable items={secondHalf} />
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8 pt-4 print:mt-6 print:pt-3 border-t border-black/15">
        <Field label="Technician signature">
          <div className="border-b border-black/40 h-8" />
        </Field>
        <Field label="Notes / discrepancies">
          <div className="border-b border-black/40 h-8" />
        </Field>
      </div>

      <p className="text-[10px] text-black/40 mt-3 text-right">Printed {today}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/50 mb-0.5">{label}</p>
      {children}
    </div>
  );
}

function ItemTable({ items }) {
  return (
    <table className="w-full text-xs print:text-[10.5px] border-collapse">
      <thead>
        <tr className="border-b-2 border-black text-left text-[10px] uppercase tracking-wide text-black/60">
          <th className="py-1.5 pr-1">Item</th>
          <th className="py-1.5 pr-1 w-12 text-right">Code</th>
          <th className="py-1.5 pl-2 w-16 text-right">Count</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.itemId} className="border-b border-black/10">
            <td className="py-1 pr-1 leading-tight">{it.name}</td>
            <td className="py-1 pr-1 text-black/50 text-right tabular-nums">#{it.invCode}</td>
            <td className="py-1 pl-2">
              <div className="border-b border-black/40 h-4" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
