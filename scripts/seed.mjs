// One-time (and safe-to-rerun) setup script.
//
// Local use:   vercel env pull .env    (after connecting Postgres storage in Vercel)
//              npm install
//              npm run seed
//
// It creates the tables if they don't exist yet, and inserts the 9 vans, the item
// catalog, and a zeroed van_inventory row for every van x item pair, without
// duplicating anything if you run it again later.

import { neon } from '@neondatabase/serverless';
import { ITEMS, VAN_CODES, LOCATIONS, splitVanCode } from '../lib/catalog.js';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = neon(connectionString);

async function main() {
  console.log('Creating tables...');

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

  console.log('Seeding locations...');
  for (const [prefix, name] of LOCATIONS) {
    await sql`
      INSERT INTO locations (prefix, name) VALUES (${prefix}, ${name})
      ON CONFLICT (prefix) DO NOTHING;
    `;
  }

  console.log('Seeding vans...');
  for (const code of VAN_CODES) {
    const { prefix, suffix } = splitVanCode(code);
    await sql`
      INSERT INTO vans (prefix, suffix) VALUES (${prefix}, ${suffix})
      ON CONFLICT (suffix) DO NOTHING;
    `;
  }

  console.log('Seeding items...');
  for (const [name, invCode] of ITEMS) {
    await sql`
      INSERT INTO items (name, inv_code)
      SELECT ${name}, ${invCode}
      WHERE NOT EXISTS (SELECT 1 FROM items WHERE inv_code = ${invCode});
    `;
  }

  console.log('Seeding van_inventory (zeroed rows for every van x item)...');
  await sql`
    INSERT INTO van_inventory (van_id, item_id, qty, pending_delta)
    SELECT v.id, i.id, 0, 0
    FROM vans v
    CROSS JOIN items i
    ON CONFLICT (van_id, item_id) DO NOTHING;
  `;

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
