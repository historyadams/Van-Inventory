import { NextResponse } from 'next/server';
import { sql, getRole, getScRole } from '../../../lib/db';

// Anyone logged in (IM or SC) can view the catalog.
export async function GET() {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, name, inv_code FROM items ORDER BY name;
  `;

  const items = rows.map((r) => ({ itemId: r.id, name: r.name, invCode: r.inv_code }));
  return NextResponse.json({ items });
}

// Only SC can add a new catalog item. Adding an item automatically creates a
// zeroed van_inventory row for every existing van so it shows up (at 0) for
// every van right away.
export async function POST(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { name, invCode } = await req.json().catch(() => ({}));
  const trimmedName = (name || '').trim();
  const code = Number(invCode);

  if (!trimmedName) {
    return NextResponse.json({ error: 'Item name is required.' }, { status: 400 });
  }
  if (!Number.isInteger(code) || code <= 0) {
    return NextResponse.json({ error: 'Inventory code must be a positive whole number.' }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM items WHERE inv_code = ${code};`;
  if (existing.length > 0) {
    return NextResponse.json({ error: `Inventory code #${code} is already in use.` }, { status: 409 });
  }

  const [newItem] = await sql`
    INSERT INTO items (name, inv_code) VALUES (${trimmedName}, ${code})
    RETURNING id;
  `;

  await sql`
    INSERT INTO van_inventory (van_id, item_id, qty, pending_delta)
    SELECT v.id, ${newItem.id}, 0, 0 FROM vans v
    ON CONFLICT (van_id, item_id) DO NOTHING;
  `;

  return NextResponse.json({ ok: true, itemId: newItem.id });
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
