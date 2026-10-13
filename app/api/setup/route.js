// Browser-accessible, safe-to-rerun setup route.
//
// Visit:  https://your-site.vercel.app/api/setup?key=YOUR_SETUP_KEY
//
// Creates the tables if they don't exist yet, and inserts the 9 vans, the item
// catalog, and a zeroed van_inventory row for every van x item pair. Safe to
// visit again later (e.g. after editing lib/catalog.js) - it won't duplicate
// anything or wipe existing counts.
//
// Requires a SETUP_KEY environment variable in Vercel (Project Settings ->
// Environment Variables) so a random visitor can't trigger this by guessing
// the URL. Any value works - it just has to match.

import { sql } from '../../../lib/db';
import { ITEMS, VAN_CODES, LOCATIONS, splitVanCode } from '../../../lib/catalog';

export async function GET(request) {
  const setupKey = process.env.SETUP_KEY;
  if (!setupKey) {
    return Response.json(
      { error: 'SETUP_KEY is not set in Environment Variables. Add it, redeploy, then retry.' },
      { status: 500 }
    );
  }

  const providedKey = new URL(request.url).searchParams.get('key');
  if (providedKey !== setupKey) {
    return Response.json({ error: 'Missing or incorrect ?key=' }, { status: 401 });
  }

  const log = [];

  try {
    log.push('Creating tables...');

    await sql`
      CREATE TABLE IF NOT EXISTS locations (
        prefix TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vans (
        id SERIAL PRIMARY KEY,
        prefix TEXT NOT NULL REFERENCES locations(prefix),
        suffix TEXT NOT NULL UNIQUE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        inv_code INTEGER NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS van_inventory (
        van_id INTEGER NOT NULL REFERENCES vans(id),
        item_id INTEGER NOT NULL REFERENCES items(id),
        qty INTEGER NOT NULL DEFAULT 0,
        pending_delta INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (van_id, item_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS update_history (
        id SERIAL PRIMARY KEY,
        van_id INTEGER NOT NULL REFERENCES vans(id),
        item_id INTEGER NOT NULL REFERENCES items(id),
        delta_applied INTEGER NOT NULL,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;

    log.push('Seeding locations...');
    for (const [prefix, name] of LOCATIONS) {
      await sql`
        INSERT INTO locations (prefix, name) VALUES (${prefix}, ${name})
        ON CONFLICT (prefix) DO NOTHING;
      `;
    }

    log.push('Seeding vans...');
    for (const code of VAN_CODES) {
      const { prefix, suffix } = splitVanCode(code);
      await sql`
        INSERT INTO vans (prefix, suffix) VALUES (${prefix}, ${suffix})
        ON CONFLICT (suffix) DO NOTHING;
      `;
    }

    log.push('Seeding items...');
    for (const [name, invCode] of ITEMS) {
      await sql`
        INSERT INTO items (name, inv_code)
        SELECT ${name}, ${invCode}
        WHERE NOT EXISTS (SELECT 1 FROM items WHERE inv_code = ${invCode});
      `;
    }

    log.push('Seeding van_inventory (zeroed rows for every van x item)...');
    await sql`
      INSERT INTO van_inventory (van_id, item_id, qty, pending_delta)
      SELECT v.id, i.id, 0, 0
      FROM vans v
      CROSS JOIN items i
      ON CONFLICT (van_id, item_id) DO NOTHING;
    `;

    log.push('Done.');

    return Response.json({ success: true, log });
  } catch (err) {
    return Response.json(
      { success: false, log, error: err.message },
      { status: 500 }
    );
  }
}
