import { NextResponse } from 'next/server';
import { IM_COOKIE_NAME, SC_COOKIE_NAME } from '../../../lib/auth';

// Clears the cookie for the role that's logging out, so logging out of
// Supply Chain doesn't also log you out of Inventory Management.
export async function POST(req) {
  const { role } = await req.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true });
  if (role !== 'sc') res.cookies.set(IM_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  if (role !== 'im') res.cookies.set(SC_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}
