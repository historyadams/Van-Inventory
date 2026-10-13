import { sql } from './db';
import { SNAPSHOT_ITEMS } from './inventorySnapshot';

// One-time, self-applying upgrade for item categories. Runs the first time an
// item list is requested on each server instance and is a no-op after that:
//   1. adds items.category
//   2. imports every InventorySnapshot.xlsx item whose code isn't in the app
//      yet, as 'atypical', with a van_inventory row for every van
//   3. fills in a category for every other item from its leading number
// Step 2 is recorded in app_meta so it only ever happens once - deleting an
// imported item later won't bring it back. An advisory lock keeps two
// instances from importing at the same time.
const IMPORT_KEY = 'atypical_import_2026_12';
let ready = false;

export async function ensureCategories() {
  if (ready) return;

  const names = SNAPSHOT_ITEMS.map(([name]) => name);
  const codes = SNAPSHOT_ITEMS.map(([, code]) => code);

  await sql`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, done_at TIMESTAMPTZ NOT NULL DEFAULT now());`;

  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(360360);`,
    sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT;`,
    sql`
      INSERT INTO items (name, inv_code, category)
      SELECT t.name, t.code, 'atypical'
      FROM unnest(${names}::text[], ${codes}::int[]) AS t(name, code)
      WHERE NOT EXISTS (SELECT 1 FROM items i WHERE i.inv_code = t.code)
        AND NOT EXISTS (SELECT 1 FROM app_meta WHERE key = ${IMPORT_KEY});
    `,
    sql`
      INSERT INTO van_inventory (van_id, item_id, qty, pending_delta)
      SELECT v.id, i.id, 0, 0 FROM vans v CROSS JOIN items i
      ON CONFLICT (van_id, item_id) DO NOTHING;
    `,
    sql`
      UPDATE items SET category = CASE
        WHEN inv_code::text LIKE '1%' THEN 'mounts'
        WHEN inv_code::text LIKE '2%' THEN 'printers'
        WHEN inv_code::text LIKE '3%' AND name ~* '^\\s*pax\\M' THEN 'payments'
        WHEN inv_code::text LIKE '3%' THEN 'hardware'
        WHEN inv_code::text LIKE '9%' THEN 'systems'
        ELSE 'atypical'
      END
      WHERE category IS NULL;
    `,
    sql`INSERT INTO app_meta (key) VALUES (${IMPORT_KEY}) ON CONFLICT (key) DO NOTHING;`,
  ]);

  ready = true;
}
