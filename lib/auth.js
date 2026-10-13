const encoder = new TextEncoder();

// SESSION_SECRET must be set in Vercel's Environment Variables. Without it no
// one can log in (rather than falling back to a guessable built-in secret).
async function hmac(value) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// role is 'im' (Inventory Management) or 'sc' (Supply Chain)
export async function signRole(role) {
  const sig = await hmac(role);
  if (!sig) throw new Error('SESSION_SECRET is not set.');
  return `${role}.${sig}`;
}

export async function verifyRoleCookie(value) {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const [role, sig] = parts;
  if (role !== 'im' && role !== 'sc') return null;
  const expected = await hmac(role);
  if (!expected || sig !== expected) return null;
  return role;
}

// Separate cookies per role so an IM session and an SC session can both be
// logged in at the same time in the same browser, in different tabs, without
// one login overwriting the other's session.
export const IM_COOKIE_NAME = 'van_role_im';
export const SC_COOKIE_NAME = 'van_role_sc';
