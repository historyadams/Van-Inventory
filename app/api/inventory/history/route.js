import { NextResponse } from 'next/server';
import { getRole, sql } from '../../../../lib/db';
import { parseDateRange } from '../../../../lib/reportDates';

export async function GET(req) {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const vanId = searchParams.get('van');
  if (!vanId) {
    return NextResponse.json({ error: 'Missing van id.' }, { status: 400 });
  }

  const { start, end, error } = parseDateRange(req.url);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const stockRows = await sql`
    SELECT i.id AS item_id, i.name, i.inv_code, vi.qty
    FROM van_inventory vi
    JOIN items i ON i.id = vi.item_id
    WHERE vi.van_id = ${vanId}
    ORDER BY i.name;
  `;

  const historyRows = await sql`
    SELECT item_id, delta_applied, completed_at
    FROM update_history
    WHERE van_id = ${vanId}
      AND completed_at >= ${start}::date
      AND completed_at < (${end}::date + INTERVAL '1 day')
    ORDER BY completed_at DESC;
  `;

  const historyByItem = new Map();
  for (const h of historyRows) {
    if (!historyByItem.has(h.item_id)) historyByItem.set(h.item_id, []);
    historyByItem.get(h.item_id).push({ delta: h.delta_applied, completedAt: h.completed_at });
  }

  const items = stockRows.map((r) => ({
    itemId: r.item_id,
    name: r.name,
    invCode: r.inv_code,
    currentQty: r.qty,
    history: historyByItem.get(r.item_id) || [],
  }));

  return NextResponse.json({ items });
}
