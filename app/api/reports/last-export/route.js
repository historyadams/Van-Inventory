import { NextResponse } from 'next/server';
import { sql, getScRole } from '../../../../lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS export_log (
      id SERIAL PRIMARY KEY,
      exported_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
}

export async function GET() {
  const role = await getScRole();
  if (role !== 'sc') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  await ensureTable();
  const rows = await sql`SELECT exported_at FROM export_log ORDER BY exported_at DESC LIMIT 1;`;
  return NextResponse.json({ lastExportedAt: rows[0]?.exported_at || null });
}
