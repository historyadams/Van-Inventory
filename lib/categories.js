// Item categories used by the filter buttons. Order here is button order.
// Atypical items are hidden unless their button is on or you're searching.
export const CATEGORIES = [
  { key: 'mounts', label: 'Drawers & Mounts' },
  { key: 'printers', label: 'Printers' },
  { key: 'payments', label: 'Payment Terminals' },
  { key: 'hardware', label: 'Hardware & Network' },
  { key: 'systems', label: '360 Systems' },
  { key: 'atypical', label: 'Atypical' },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export function categoryLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}

// Default category from the item's leading number. 3xxx is split by type:
// PAX devices are payment terminals, everything else is hardware.
export function suggestCategory(name, invCode) {
  const lead = String(invCode || '').charAt(0);
  if (lead === '1') return 'mounts';
  if (lead === '2') return 'printers';
  if (lead === '3') return /^\s*pax\b/i.test(name || '') ? 'payments' : 'hardware';
  if (lead === '9') return 'systems';
  return 'atypical';
}

// Shared visibility rule for item lists:
// - with categories selected, only those categories show
// - with none selected, everything except Atypical shows
// - while searching, Atypical items are included too
// - `keep(item)` forces an item visible (e.g. it has unsent taps)
export function filterItems(items, { selected, query, keep }) {
  const q = (query || '').trim().toLowerCase();
  return items.filter((it) => {
    if (keep && keep(it)) return true;
    if (q && !it.name.toLowerCase().includes(q) && !String(it.invCode).includes(q)) return false;
    if (selected.size > 0) return selected.has(it.category);
    return q ? true : it.category !== 'atypical';
  });
}
