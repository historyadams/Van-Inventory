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
  const valid = changes.filter(
    ({ itemId, delta }) => itemId && Number.isInteger(delta) && delta > 0
  );
  if (valid.length === 0) {
    return NextResponse.json({ error: 'Nothing to submit.' }, { status: 400 });
  }

  // One transaction for the whole send: either every item is recorded or none
  // is, so retrying after a failure can never double-count. Each row is an
  // atomic increment, so two people sending to the same van at once never
  // overwrite each other.
  await sql.transaction(
    valid.map(
      ({ itemId, delta }) => sql`
        UPDATE van_inventory
        SET pending_delta = pending_delta + ${delta}, updated_at = now()
        WHERE van_id = ${vanId} AND item_id = ${itemId};
      `
    )
  );

  return NextResponse.json({ ok: true });
}
