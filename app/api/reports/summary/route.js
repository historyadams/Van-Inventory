import { NextResponse } from 'next/server';
import { getScRole, sql } from '../../../../lib/db';
import { parseDateRange } from '../../../../lib/reportDates';

export async function GET(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { start, end, error } = parseDateRange(req.url);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const rows = await sql`
    SELECT
      v.id AS van_id,
      v.prefix,
      v.suffix,
      l.name AS location_name,
      i.id AS item_id,
      i.name AS item_name,
      i.inv_code,
      h.delta_applied,
      h.completed_at
    FROM update_history h
    JOIN vans v ON v.id = h.van_id
    JOIN locations l ON l.prefix = v.prefix
    JOIN items i ON i.id = h.item_id
    WHERE h.completed_at >= ${start}::date
      AND h.completed_at < (${end}::date + INTERVAL '1 day')
      AND h.delta_applied > 0
    ORDER BY l.name, v.suffix, h.completed_at DESC;
  `;

  const vanMap = new Map();
  for (const r of rows) {
    if (!vanMap.has(r.van_id)) {
      vanMap.set(r.van_id, {
        vanId: r.van_id,
        code: `${r.prefix}${r.suffix}`,
        locationName: r.location_name,
        moves: [],
      });
    }
    vanMap.get(r.van_id).moves.push({
      itemId: r.item_id,
      name: r.item_name,
      invCode: r.inv_code,
      delta: r.delta_applied,
      completedAt: r.completed_at,
    });
  }

  return NextResponse.json({ vans: Array.from(vanMap.values()) });
}
