import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { IM_COOKIE_NAME, SC_COOKIE_NAME, verifyRoleCookie } from './auth';

// Lazily constructed so that `next build` doesn't fail just because the database
// env var isn't set at build time - it only needs to exist once a request actually
// runs on Vercel.
let _sql = null;
function getSqlClient() {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error(
        'No database connection string found. Set DATABASE_URL (or POSTGRES_URL) in your Vercel project\'s Environment Variables.'
      );
    }
    _sql = neon(connectionString);
  }
  return _sql;
}

// sql`...` resolves directly to an array of row objects.
// sql.transaction([sql`...`, sql`...`]) runs multiple statements as one atomic transaction.
export const sql = (...args) => getSqlClient()(...args);
sql.transaction = (...args) => getSqlClient().transaction(...args);

// Reads and verifies the IM login cookie. Returns 'im' or null.
export async function getImRole() {
  const cookieStore = cookies();
  const value = cookieStore.get(IM_COOKIE_NAME)?.value;
  const role = await verifyRoleCookie(value);
  return role === 'im' ? role : null;
}

// Reads and verifies the SC login cookie. Returns 'sc' or null.
export async function getScRole() {
  const cookieStore = cookies();
  const value = cookieStore.get(SC_COOKIE_NAME)?.value;
  const role = await verifyRoleCookie(value);
  return role === 'sc' ? role : null;
}

// Returns whichever role (if any) is currently logged in, for endpoints that
// just need "some valid session" rather than a specific one.
export async function getRole() {
  const im = await getImRole();
  if (im) return im;
  return getScRole();
}
