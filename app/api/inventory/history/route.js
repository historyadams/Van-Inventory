import { NextResponse } from 'next/server';
import { getRole, sql } from '../../../../lib/db';
import { parseDateRange, REPORT_TZ } from '../../../../lib/reportDates';

// Movement log for one van: every confirmed load in the date range, grouped by
// the "Update completed" that confirmed it (rows from one confirmation share
// the same timestamp because they're written in one transaction).
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

  const rows = await sql`
    SELECT h.completed_at, h.delta_applied, i.id AS item_id, i.name, i.inv_code
    FROM update_history h
    JOIN items i ON i.id = h.item_id
    WHERE h.van_id = ${vanId}
      AND h.delta_applied > 0
      AND (h.completed_at AT TIME ZONE ${REPORT_TZ})::date BETWEEN ${start}::date AND ${end}::date
    ORDER BY h.completed_at DESC, i.name;
  `;

  const loads = [];
  const byTime = new Map();
  for (const r of rows) {
    const key = new Date(r.completed_at).toISOString();
    if (!byTime.has(key)) {
      const load = { completedAt: r.completed_at, items: [] };
      byTime.set(key, load);
      loads.push(load);
    }
    byTime.get(key).items.push({
      itemId: r.item_id,
      name: r.name,
      invCode: r.inv_code,
      qty: r.delta_applied,
    });
  }

  return NextResponse.json({ loads });
}
