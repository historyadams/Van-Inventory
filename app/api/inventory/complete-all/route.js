import { NextResponse } from 'next/server';
import { sql, getScRole } from '../../../../lib/db';

// "Update all vans": confirms every van's pending additions in one atomic
// transaction. All rows written share the transaction's now(), so that
// timestamp (returned as exact Postgres text) identifies this batch for the
// printable summary.
export async function POST() {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const [inserted] = await sql.transaction([
    sql`
      INSERT INTO update_history (van_id, item_id, delta_applied)
      SELECT van_id, item_id, pending_delta
      FROM van_inventory
      WHERE pending_delta > 0
      RETURNING completed_at::text AS batch_at;
    `,
    sql`
      UPDATE van_inventory
      SET pending_delta = 0, updated_at = now()
      WHERE pending_delta != 0;
    `,
  ]);

  return NextResponse.json({ ok: true, batchAt: inserted[0]?.batch_at || null, rows: inserted.length });
}
