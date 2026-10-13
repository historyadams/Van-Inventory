import { NextResponse } from 'next/server';
import { getScRole, sql } from '../../../../lib/db';

// Everything confirmed by one "Update all vans" click, identified by the
// exact completed_at timestamp that the complete-all route returned.
export async function GET(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const at = new URL(req.url).searchParams.get('at');
  if (!at) {
    return NextResponse.json({ error: 'Missing batch time.' }, { status: 400 });
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
    WHERE h.completed_at = ${at}::timestamptz
      AND h.delta_applied > 0
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
      qty: r.delta_applied,
    });
  }

  return NextResponse.json({
    completedAt: rows[0]?.completed_at || null,
    vans: Array.from(vanMap.values()),
  });
}
