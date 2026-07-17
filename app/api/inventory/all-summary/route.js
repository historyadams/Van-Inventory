import { NextResponse } from 'next/server';
import { getRole, sql } from '../../../../lib/db';
import { parseDateRange } from '../../../../lib/reportDates';

export async function GET(req) {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  const { start, end, error } = parseDateRange(req.url);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  // Only returns items that actually had something added or removed in the
  // date range - keeps the "all vans on one page" view tight instead of
  // showing every item x every van.
  const rows = await sql`
    SELECT
      v.id AS van_id,
      v.prefix,
      v.suffix,
      l.name AS location_name,
      i.id AS item_id,
      i.name AS item_name,
      i.inv_code,
      vi.qty AS current_qty,
      COALESCE(SUM(CASE WHEN h.delta_applied > 0 THEN h.delta_applied ELSE 0 END), 0) AS added,
      COALESCE(SUM(CASE WHEN h.delta_applied < 0 THEN -h.delta_applied ELSE 0 END), 0) AS removed
    FROM van_inventory vi
    JOIN vans v ON v.id = vi.van_id
    JOIN locations l ON l.prefix = v.prefix
    JOIN items i ON i.id = vi.item_id
    LEFT JOIN update_history h
      ON h.van_id = vi.van_id
      AND h.item_id = vi.item_id
      AND h.completed_at >= ${start}::date
      AND h.completed_at < (${end}::date + INTERVAL '1 day')
    GROUP BY v.id, v.prefix, v.suffix, l.name, i.id, i.name, i.inv_code, vi.qty
    HAVING
      COALESCE(SUM(CASE WHEN h.delta_applied > 0 THEN h.delta_applied ELSE 0 END), 0) > 0
      OR COALESCE(SUM(CASE WHEN h.delta_applied < 0 THEN -h.delta_applied ELSE 0 END), 0) > 0
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
      currentQty: r.current_qty,
      added: r.added,
      removed: r.removed,
    });
  }

  return NextResponse.json({ vans: Array.from(vanMap.values()) });
}
