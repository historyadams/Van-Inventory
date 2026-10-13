import { NextResponse } from 'next/server';
import { sql, getRole } from '../../../lib/db';

// Item list for one van, with how many of each have been submitted by
// Inventory Management but not yet confirmed by Supply Chain. Van stock
// counts are no longer tracked - only additions.
export async function GET(req) {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  const vanId = req.nextUrl.searchParams.get('van');
  if (!vanId) {
    return NextResponse.json({ error: 'Missing van id.' }, { status: 400 });
  }

  const rows = await sql`
    SELECT i.id AS item_id, i.name, i.inv_code, vi.pending_delta
    FROM items i
    JOIN van_inventory vi ON vi.item_id = i.id
    WHERE vi.van_id = ${vanId}
    ORDER BY i.name;
  `;

  const items = rows.map((r) => ({
    itemId: r.item_id,
    name: r.name,
    invCode: r.inv_code,
    pending: Math.max(0, r.pending_delta),
  }));

  return NextResponse.json({ items });
}
