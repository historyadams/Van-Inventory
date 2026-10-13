import { NextResponse } from 'next/server';
import { getRole, sql } from '../../../../lib/db';
import { parseDateRange, REPORT_TZ } from '../../../../lib/reportDates';

export async function GET(req) {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  const { start, end, error } = parseDateRange(req.url);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  // Total loaded into each van per item over the date range. Only items that
  // were actually loaded show up.
  const rows = await sql`
    SELECT
      v.id AS van_id,
      v.prefix,
      v.suffix,
      l.name AS location_name,
      i.id AS item_id,
      i.name AS item_name,
      i.inv_code,
      SUM(h.delta_applied)::int AS added
    FROM update_history h
    JOIN vans v ON v.id = h.van_id
    JOIN locations l ON l.prefix = v.prefix
    JOIN items i ON i.id = h.item_id
    WHERE h.delta_applied > 0
      AND (h.completed_at AT TIME ZONE ${REPORT_TZ})::date BETWEEN ${start}::date AND ${end}::date
    GROUP BY v.id, v.prefix, v.suffix, l.name, i.id, i.name, i.inv_code
    ORDER BY l.name, v.suffix, i.name;
  `;

  const vanMap = new Map();
  for (const r of rows) {
    if (!vanMap.has(r.van_id)) {
      vanMap.set(r.van_id, {
        vanId: r.van_id,
        code: `${r.prefix}${r.suffix}`,
        locationName: r.location_name,
        items: [],
      });
    }
    vanMap.get(r.van_id).items.push({
      itemId: r.item_id,
      name: r.item_name,
      invCode: r.inv_code,
      added: r.added,
    });
  }

  return NextResponse.json({ vans: Array.from(vanMap.values()) });
}
