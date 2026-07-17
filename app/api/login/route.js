import { NextResponse } from 'next/server';
import { signRole, IM_COOKIE_NAME, SC_COOKIE_NAME } from '../../../lib/auth';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { role, password } = body;

  const validPasswords = {
    im: process.env.IM_PASSWORD || 'Payments123$',
    sc: process.env.SC_PASSWORD || 'Payments456&',
  };

  if (role !== 'im' && role !== 'sc') {
    return NextResponse.json({ error: 'Unknown login.' }, { status: 400 });
  }

  if (!password || password !== validPasswords[role]) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const token = await signRole(role);
  const cookieName = role === 'im' ? IM_COOKIE_NAME : SC_COOKIE_NAME;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
