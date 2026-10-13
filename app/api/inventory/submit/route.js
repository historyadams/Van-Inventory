import { NextResponse } from 'next/server';
import { sql, getImRole } from '../../../../lib/db';

export async function POST(req) {
  const role = await getImRole();
  if (role !== 'im') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { vanId, changes } = await req.json().catch(() => ({}));

  if (!vanId || !Array.isArray(changes) || changes.length === 0) {
    return NextResponse.json({ error: 'Nothing to submit.' }, { status: 400 });
  }

  // Additions only: anything that isn't a positive whole number is ignored.
  // Each row's pending_delta is incremented atomically at the database level, so if two
  // people submit additions to the same van around the same time, neither submission
  // overwrites or loses the other's numbers.
  for (const change of changes) {
    const { itemId, delta } = change;
    if (!itemId || !Number.isInteger(delta) || delta <= 0) continue;
    await sql`
      UPDATE van_inventory
      SET pending_delta = pending_delta + ${delta}, updated_at = now()
      WHERE van_id = ${vanId} AND item_id = ${itemId};
    `;
  }

  return NextResponse.json({ ok: true });
}
