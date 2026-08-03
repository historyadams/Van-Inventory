import { sql } from '../../../lib/db';

// Browser-visitable, one-time data fix. Visit:
//   https://your-site.vercel.app/api/rename-vans?key=YOUR_SETUP_KEY
//
// Renames these van suffixes:
//   AHC26 -> AH0M4
//   AHG22 -> AH1M4
//   AHC27 -> AH2M4
//   AHC28 -> AH5M4
//
// Safe to visit more than once - vans already renamed simply won't match and
// will be skipped (0 rows affected for that pair).

const RENAMES = [
  { from: 'C26', to: '0M4' },
  { from: 'G22', to: '1M4' },
  { from: 'C27', to: '2M4' },
  { from: 'C28', to: '5M4' },
];

export async function GET(request) {
  const setupKey = process.env.SETUP_KEY;
  if (!setupKey) {
    return Response.json(
      { error: 'SETUP_KEY is not set in Environment Variables.' },
      { status: 500 }
    );
  }

  const providedKey = new URL(request.url).searchParams.get('key');
  if (providedKey !== setupKey) {
    return Response.json({ error: 'Missing or incorrect ?key=' }, { status: 401 });
  }

  const results = [];

  for (const { from, to } of RENAMES) {
    const rows = await sql`
      UPDATE vans SET suffix = ${to} WHERE suffix = ${from}
      RETURNING id, prefix, suffix;
    `;
    results.push({
      from,
      to,
      updated: rows.length,
      van: rows[0] ? `${rows[0].prefix}${rows[0].suffix}` : null,
    });
  }

  return Response.json({ success: true, results });
}
