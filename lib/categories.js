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
// - while searching, every item is searched (all categories, Atypical too)
//   and the category buttons are ignored
// - otherwise, with categories selected, only those categories show
// - with none selected ("All"), everything except Atypical shows
export function filterItems(items, { selected, query }) {
  const q = (query || '').trim().toLowerCase();
  return items.filter((it) => {
    if (q) return it.name.toLowerCase().includes(q) || String(it.invCode).includes(q);
    const cat = it.category || 'atypical';
    if (selected.size > 0) return selected.has(cat);
    return cat !== 'atypical';
  });
}

// Splits a list into [{ key, label, items }] in button order, skipping empty
// categories. Items without a category are treated as Atypical.
export function groupByCategory(items) {
  return CATEGORIES.map((c) => ({
    ...c,
    items: items.filter((it) => (it.category || 'atypical') === c.key),
  })).filter((g) => g.items.length > 0);
}

export function countByCategory(items) {
  const counts = {};
  for (const it of items) {
    const key = it.category || 'atypical';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
