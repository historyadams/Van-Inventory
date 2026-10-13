import { NextResponse } from 'next/server';
import { sql, getRole, getScRole } from '../../../lib/db';
import { ensureCategories } from '../../../lib/schema';
import { CATEGORY_KEYS, suggestCategory } from '../../../lib/categories';

// Anyone logged in (IM or SC) can view the catalog. dupCode is true when
// another item shares the same inventory code.
export async function GET() {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  await ensureCategories();

  const rows = await sql`
    SELECT i.id, i.name, i.inv_code, i.category,
      (SELECT COUNT(*) FROM items i2 WHERE i2.inv_code = i.inv_code) > 1 AS dup_code
    FROM items i
    ORDER BY i.name;
  `;

  const items = rows.map((r) => ({ itemId: r.id, name: r.name, invCode: r.inv_code, dupCode: r.dup_code, category: r.category }));
  return NextResponse.json({ items });
}

// Only SC can add a new catalog item. Adding an item automatically creates a
// van_inventory row for every existing van so it can be loaded into any van.
//
// Inventory codes may be shared by more than one item (e.g. two 360 Pro
// builds), but only after the user confirms: the first request returns 409
// with `duplicate: true` and the names already using the code, and the client
// resends with `confirmDuplicate: true`.
export async function POST(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { name, invCode, confirmDuplicate, category } = await req.json().catch(() => ({}));
  const trimmedName = (name || '').trim();
  const code = Number(invCode);

  if (!trimmedName) {
    return NextResponse.json({ error: 'Item name is required.' }, { status: 400 });
  }
  if (!Number.isInteger(code) || code <= 0) {
    return NextResponse.json({ error: 'Inventory code must be a positive whole number.' }, { status: 400 });
  }

  const cat = CATEGORY_KEYS.includes(category) ? category : suggestCategory(trimmedName, code);
  await ensureCategories();

  const existing = await sql`SELECT id, name FROM items WHERE inv_code = ${code} ORDER BY name;`;
  if (existing.some((r) => r.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
    return NextResponse.json(
      { error: `"${trimmedName}" already exists with code #${code}.` },
      { status: 409 }
    );
  }
  if (existing.length > 0 && !confirmDuplicate) {
    return NextResponse.json(
      { duplicate: true, code, existingNames: existing.map((r) => r.name) },
      { status: 409 }
    );
  }

  // Older databases were created with inv_code UNIQUE; drop it so shared
  // codes are allowed. No-op once it's gone.
  if (existing.length > 0) {
    await sql`ALTER TABLE items DROP CONSTRAINT IF EXISTS items_inv_code_key;`;
  }

  const [newItem] = await sql`
    INSERT INTO items (name, inv_code, category) VALUES (${trimmedName}, ${code}, ${cat})
    RETURNING id;
  `;

  await sql`
    INSERT INTO van_inventory (van_id, item_id, qty, pending_delta)
    SELECT v.id, ${newItem.id}, 0, 0 FROM vans v
    ON CONFLICT (van_id, item_id) DO NOTHING;
  `;

  return NextResponse.json({ ok: true, itemId: newItem.id });
}

// Only SC can change an item's category (e.g. move an Atypical item into a
// regular category once it starts going into vans).
export async function PATCH(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { itemId, category } = await req.json().catch(() => ({}));
  if (!itemId || !CATEGORY_KEYS.includes(category)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  await ensureCategories();
  await sql`UPDATE items SET category = ${category} WHERE id = ${itemId};`;
  return NextResponse.json({ ok: true });
}

// Only SC can remove a catalog item. This permanently removes it from every
// van's inventory too, along with its update history.
export async function DELETE(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { itemId } = await req.json().catch(() => ({}));
  if (!itemId) {
    return NextResponse.json({ error: 'Missing item id.' }, { status: 400 });
  }

  await sql`DELETE FROM update_history WHERE item_id = ${itemId};`;
  await sql`DELETE FROM van_inventory WHERE item_id = ${itemId};`;
  await sql`DELETE FROM items WHERE id = ${itemId};`;

  return NextResponse.json({ ok: true });
}
