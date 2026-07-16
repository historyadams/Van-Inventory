const encoder = new TextEncoder();

async function hmac(value) {
  const secret = process.env.SESSION_SECRET || 'van-tracker-dev-secret-change-me';
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
  return `${role}.${sig}`;
}

export async function verifyRoleCookie(value) {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const [role, sig] = parts;
  if (role !== 'im' && role !== 'sc') return null;
  const expected = await hmac(role);
  if (sig !== expected) return null;
  return role;
}

export const COOKIE_NAME = 'van_role';
