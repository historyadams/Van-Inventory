import { NextResponse } from 'next/server';
import { sql, getRole } from '../../../../lib/db';

const VALID_PREFIXES = ['AH', 'NC', 'SD'];

export async function POST(req) {
  const role = await getRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { vanId, prefix } = await req.json().catch(() => ({}));

  if (!vanId || !VALID_PREFIXES.includes(prefix)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  await sql`
    UPDATE vans SET prefix = ${prefix} WHERE id = ${vanId};
  `;

  return NextResponse.json({ ok: true });
}
