import { NextResponse } from 'next/server';
import { sql, getScRole } from '../../../../lib/db';

export async function POST(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { vanId } = await req.json().catch(() => ({}));
  if (!vanId) {
    return NextResponse.json({ error: 'Missing van id.' }, { status: 400 });
  }

  // Both statements run as a single atomic transaction: the pending additions are
  // written to the movement log, then cleared. Because this reads pending_delta at
  // the moment the transaction runs (not a value fetched earlier in JS), anything
  // submitted a split second before the click is still captured.
  await sql.transaction([
    sql`
      INSERT INTO update_history (van_id, item_id, delta_applied)
      SELECT van_id, item_id, pending_delta
      FROM van_inventory
      WHERE van_id = ${vanId} AND pending_delta > 0;
    `,
    sql`
      UPDATE van_inventory
      SET pending_delta = 0, updated_at = now()
      WHERE van_id = ${vanId} AND pending_delta != 0;
    `,
  ]);

  return NextResponse.json({ ok: true });
}
