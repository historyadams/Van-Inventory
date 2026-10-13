import { NextResponse } from 'next/server';
import { sql, getRole } from '../../../lib/db';

export async function GET() {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  // pending_items = how many different items are waiting on Supply Chain to
  // confirm for that van.
  const rows = await sql`
    SELECT v.id, v.prefix, v.suffix, l.name AS location_name,
      (SELECT COUNT(*)::int FROM van_inventory vi
        WHERE vi.van_id = v.id AND vi.pending_delta > 0) AS pending_items
    FROM vans v
    JOIN locations l ON l.prefix = v.prefix
    ORDER BY l.name, v.suffix;
  `;

  const vans = rows.map((r) => ({
    id: r.id,
    prefix: r.prefix,
    suffix: r.suffix,
    code: `${r.prefix}${r.suffix}`,
    locationName: r.location_name,
    pendingItems: r.pending_items,
  }));

  return NextResponse.json({ vans });
}
