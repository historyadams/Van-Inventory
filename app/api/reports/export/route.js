import { getScRole, sql } from '../../../../lib/db';
import { parseDateRange } from '../../../../lib/reportDates';
import { reportLocationLabel } from '../../../../lib/reportLocationLabels';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req) {
  const role = await getScRole();
  if (role !== 'sc') {
    return new Response(JSON.stringify({ error: 'Not authorized.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { start, end, error } = parseDateRange(req.url);
  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await sql`
    SELECT
      l.name AS location_name,
      v.prefix,
      v.suffix,
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
    ORDER BY l.name, v.suffix, h.completed_at;
  `;

  const header = ['Location', 'Van', 'Item', 'Inv Code', 'Qty Moved In', 'Date'];
  const lines = [header.join(',')];

  for (const r of rows) {
    lines.push(
      [
        csvEscape(reportLocationLabel(r.prefix)),
        csvEscape(`${r.prefix}${r.suffix}`),
        csvEscape(r.item_name),
        csvEscape(r.inv_code),
        csvEscape(r.delta_applied),
        csvEscape(new Date(r.completed_at).toLocaleString('en-US')),
      ].join(',')
    );
  }

  // Record that an export just happened, so the SC page can show "last exported at."
  await sql`
    CREATE TABLE IF NOT EXISTS export_log (
      id SERIAL PRIMARY KEY,
      exported_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`INSERT INTO export_log (exported_at) VALUES (now());`;

  const csv = lines.join('\n');
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="van-transfers_${start}_to_${end}.csv"`,
    },
  });
}
